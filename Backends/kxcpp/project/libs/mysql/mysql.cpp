/*
 * Copyright (C)2005-2012 Haxe Foundation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

#ifndef STATIC_LINK
#define IMPLEMENT_API
#endif

#include <stdlib.h>
#include <string.h>
#include <hx/CFFI.h>


#include <stdio.h>
#include <time.h>
#include "my_proto/mysql.h"
#include <string.h>

/**
	<doc>
	<h1>MySQL</h1>
	<p>
	API to connect and use MySQL database
	</p>
	</doc>
**/

#define CNX(o)			((connection*)val_data(o))
#define RESULT(o)		((result*)val_data(o))

namespace
{

typedef struct {
	MYSQL *m;
	value conv_date;
	value conv_bytes;
	value conv_string;
} connection;

DEFINE_KIND(k_mysql_connection);
DEFINE_KIND(k_mysql_result);

static void error( MYSQL *m, const char *msg ) {
	buffer b = alloc_buffer(msg);
	buffer_append(b," ");
	buffer_append(b,mysql_error(m));
	bfailure(b);
}

// ---------------------------------------------------------------
// Result

/**
	<doc><h2>Result</h2></doc>
**/

#undef CONV_FLOAT
typedef enum {
	CONV_INT,
	CONV_STRING,
	CONV_FLOAT,
	CONV_BINARY,
	CONV_DATE,
	CONV_DATETIME,
	CONV_BOOL
} CONV;

typedef struct {
	MYSQL_RES *r;
	int nfields;
	CONV *fields_convs;
	field *fields_ids;
	MYSQL_ROW current;
	value conv_date;
	value conv_string;
	value conv_bytes;
} result;

static void free_result( value o ) {
	result *r = RESULT(o);
	mysql_free_result(r->r);
}

/**
	result_set_conv_date : 'result -> function:1 -> void
	<doc>Set the function that will convert a Date or DateTime string
	to the corresponding value.</doc>
**/
static value result_set_conv_date( value o, value c ) {
	val_check_function(c,1);
	if( val_is_int(o) )
		return val_true;
	val_check_kind(o,k_mysql_result);
	RESULT(o)->conv_date = c;
	return val_true;
}

/**
	result_get_length : 'result -> int
	<doc>Return the number of rows returned or affected</doc>
**/
static value result_get_length( value o ) {
	if( val_is_int(o) )
		return o;
	val_check_kind(o,k_mysql_result);
	return alloc_int( (int)mysql_num_rows(RESULT(o)->r) );
}

/**
	result_get_nfields : 'result -> int
	<doc>Return the number of fields in a result row</doc>
**/
static value result_get_nfields( value o ) {
	val_check_kind(o,k_mysql_result);
	return alloc_int(RESULT(o)->nfields);
}

/**
	result_get_fields_names : 'result -> string array
	<doc>Return the fields names corresponding results columns</doc>
**/
static value result_get_fields_names( value o ) {
	result *r;
	value a;
	int k;
	MYSQL_FIELD *fields;
	val_check_kind(o,k_mysql_result);
	r = RESULT(o);
	fields = mysql_fetch_fields(r->r);
	a = alloc_array(r->nfields);
	for(k=0;k<r->nfields;k++)
   {
		val_array_set_i(a,k,alloc_string(fields[k].name));
   }
	return a;
}

/**
	result_next : 'result -> object?
	<doc>
	Return the next row if available. A row is represented
	as an object, which fields have been converted to the
	corresponding Neko value (int, float or string). For
	Date and DateTime you can specify your own conversion
	function using [result_set_conv_date]. By default they're
	returned as plain strings. Additionally, the TINYINT(1) will
	be converted to either true or false if equal to 0.
	</doc>
**/
static value result_next( value o ) {
	result *r;
	unsigned long *lengths = NULL;
	MYSQL_ROW row;
	val_check_kind(o,k_mysql_result);
	r = RESULT(o);
	row = mysql_fetch_row(r->r);
	if( row == NULL )
		return val_null;
	{
		int i;
		value cur = alloc_empty_object();
		r->current = row;
		for(i=0;i<r->nfields;i++)
			if( row[i] != NULL ) {
				value v;
				switch( r->fields_convs[i] ) {
				case CONV_INT:
					v = alloc_best_int(atoi(row[i]));
					break;
				case CONV_STRING:
					v = alloc_string(row[i]);
					if( r->conv_string != NULL )
						v = val_call1(r->conv_string,v);
					break;
				case CONV_BOOL:
					v = alloc_bool( *row[i] != '0' );
					break;
				case CONV_FLOAT:
					v = alloc_float(atof(row[i]));
					break;
				case CONV_BINARY:
					if( lengths == NULL ) {
						lengths = mysql_fetch_lengths(r->r);
						if( lengths == NULL )
							val_throw(alloc_string("mysql_fetch_lengths"));
					}
					v = copy_string(row[i],lengths[i]);
					if( r->conv_bytes != NULL )
						v = val_call1(r->conv_bytes,v);
					break;
				case CONV_DATE:
					if( r->conv_date == NULL )
						v = alloc_string(row[i]);
					else {
						struct tm t;
						sscanf(row[i],"%4d-%2d-%2d",&t.tm_year,&t.tm_mon,&t.tm_mday);
						t.tm_hour = 0;
						t.tm_min = 0;
						t.tm_sec = 0;
						t.tm_isdst = -1;
						t.tm_year -= 1900;
						t.tm_mon--;
						v = val_call1(r->conv_date,alloc_int32((int)mktime(&t)));
					}
					break;
				case CONV_DATETIME:
					if( r->conv_date == NULL )
						v = alloc_string(row[i]);
					else {
						struct tm t;
						sscanf(row[i],"%4d-%2d-%2d %2d:%2d:%2d",&t.tm_year,&t.tm_mon,&t.tm_mday,&t.tm_hour,&t.tm_min,&t.tm_sec);
						t.tm_isdst = -1;
						t.tm_year -= 1900;
						t.tm_mon--;
						v = val_call1(r->conv_date,alloc_int32((int)mktime(&t)));
					}
					break;
				default:
					v = val_null;
					break;
				}
				alloc_field(cur,r->fields_ids[i],v);
			}
		return cur;
	}
}

/**
	result_get : 'result -> n:int -> string
	<doc>Return the [n]th field of the current row</doc>
**/
static value result_get( value o, value n ) {
	result *r;
	const char *s;
	val_check_kind(o,k_mysql_result);
	val_check(n,int);
	r = RESULT(o);
	if( val_int(n) < 0 || val_int(n) >= r->nfields )
		neko_error();
	if( !r->current ) {
		result_next(o);
		if( !r->current )
			neko_error();
	}
	s = r->current[val_int(n)];
	return alloc_string( s?s:"" );
}

/**
	result_get_int : 'result -> n:int -> int
	<doc>Return the [n]th field of the current row as an integer (or 0)</doc>
**/
static value result_get_int( value o, value n ) {
	result *r;
	const char *s;
	val_check_kind(o,k_mysql_result);
	val_check(n,int);
	r = RESULT(o);
	if( val_int(n) < 0 || val_int(n) >= r->nfields )
		neko_error();
	if( !r->current ) {
		result_next(o);
		if( !r->current )
			neko_error();
	}
	s = r->current[val_int(n)];
	return alloc_int( s?atoi(s):0 );
}

/**
	result_get_float : 'result -> n:int -> float
	<doc>Return the [n]th field of the current row as a float (or 0)</doc>
**/
static value result_get_float( value o, value n ) {
	result *r;
	const char *s;
	val_check_kind(o,k_mysql_result);
	val_check(n,int);
	r = RESULT(o);
	if( val_int(n) < 0 || val_int(n) >= r->nfields )
		neko_error();
	if( !r->current ) {
		result_next(o);
		if( !r->current )
			neko_error();
	}
	s = r->current[val_int(n)];
	return alloc_float( s?atof(s):0 );
}

static CONV convert_type( enum enum_field_types t, int flags, unsigned int length ) {
	// FIELD_TYPE_TIME
	// FIELD_TYPE_YEAR
	// FIELD_TYPE_NEWDATE
	// FIELD_TYPE_NEWDATE + 2: // 5.0 MYSQL_TYPE_BIT
	switch( t ) {
	case FIELD_TYPE_TINY:
		if( length == 1 )
			return CONV_BOOL;
	case FIELD_TYPE_SHORT:
	case FIELD_TYPE_LONG:
	case FIELD_TYPE_INT24:
		return CONV_INT;
	case FIELD_TYPE_LONGLONG:
	case FIELD_TYPE_DECIMAL:
	case FIELD_TYPE_FLOAT:
	case FIELD_TYPE_DOUBLE:
	case 246: // 5.0 MYSQL_NEW_DECIMAL
		return CONV_FLOAT;
	case FIELD_TYPE_BLOB:
	case FIELD_TYPE_TINY_BLOB:
	case FIELD_TYPE_MEDIUM_BLOB:
	case FIELD_TYPE_LONG_BLOB:
		if( (flags & BINARY_FLAG) != 0 )
			return CONV_BINARY;
		return CONV_STRING;
	case FIELD_TYPE_DATETIME:
	case FIELD_TYPE_TIMESTAMP:
		return CONV_DATETIME;
	case FIELD_TYPE_DATE:
		return CONV_DATE;
	case FIELD_TYPE_NULL:
	case FIELD_TYPE_ENUM:
	case FIELD_TYPE_SET:
	//case FIELD_TYPE_VAR_STRING:
	//case FIELD_TYPE_GEOMETRY:
	// 5.0 MYSQL_TYPE_VARCHAR
	default:
		if( (flags & BINARY_FLAG) != 0 )
			return CONV_BINARY;
		return CONV_STRING;
	}
}

static value alloc_result( connection *c, MYSQL_RES *r ) {
	value o = create_abstract(k_mysql_result,sizeof(result),free_result);
	result *res = RESULT(o);
	int num_fields = mysql_num_fields(r);
	int i,j;
	MYSQL_FIELD *fields = mysql_fetch_fields(r);
	res->r = r;
	res->conv_date = c->conv_date;
	res->conv_bytes = c->conv_bytes;
	res->conv_string = c->conv_string;
	res->current = NULL;
	res->nfields = num_fields;
	res->fields_ids = (field*)alloc_private(sizeof(field)*num_fields);
	res->fields_convs = (CONV*)alloc_private(sizeof(CONV)*num_fields);	
	for(i=0;i<num_fields;i++) {
		field id;
		if( strchr(fields[i].name,'(') )
			id = val_id("???"); // looks like an inner request : prevent hashing + cashing it
		else {
			id = val_id(fields[i].name);
			for(j=0;j<i;j++)
				if( res->fields_ids[j] == id ) {
					buffer b = alloc_buffer("Error, same field ids for : ");
					buffer_append(b,fields[i].name);
					buffer_append(b,":");
					val_buffer(b,alloc_int(i));
					buffer_append(b," and ");
					buffer_append(b,fields[j].name);
					buffer_append(b,":");
					val_buffer(b,alloc_int(j));
					buffer_append(b,".");
					bfailure(b);
				}
		}
		res->fields_ids[i] = id;
		res->fields_convs[i] = convert_type(fields[i].type,fields[i].flags,fields[i].length);
	}
	return o;
}

// ---------------------------------------------------------------
// Connection

/** <doc><h2>Connection</h2></doc> **/

/**
	close : 'connection -> void
	<doc>Close the connection. Any subsequent operation will fail on it</doc>
**/
static value close( value o ) {
	val_check_kind(o,k_mysql_connection);
	mysql_close(CNX(o)->m);
   free_abstract(o);
	return val_true;
}

/**
	select_db : 'connection -> string -> void
	<doc>Select the database</doc>
**/
static value select_db( value o, value db ) {
	val_check_kind(o,k_mysql_connection);
	val_check(db,string);
	if( mysql_select_db(CNX(o)->m,val_string(db)) != 0 )
		error(CNX(o)->m,"Failed to select database :");
	return val_true;
}

/**
	request : 'connection -> string -> 'result
	<doc>Execute an SQL request. Exception on error</doc>
**/
static value request( value o, value r )  {
	MYSQL_RES *res;
	connection *c;
	val_check_kind(o,k_mysql_connection);
	val_check(r,string);
	c = CNX(o);
	if( mysql_real_query(c->m,val_string(r),val_strlen(r)) != 0 )
		error(c->m,val_string(r));
	res = mysql_store_result(c->m);
	if( res == NULL ) {
		if( mysql_field_count(c->m) == 0 )
			return alloc_int( (int)mysql_affected_rows(c->m) );
		else
			error(c->m,val_string(r));
	}
	return alloc_result(c,res);
}

/**
	escape : 'connection -> string -> string
	<doc>Escape the string for inserting into a SQL request</doc>
**/
struct AutoBuf
{
   AutoBuf(int inLen) { buffer = new char[inLen]; }
   ~AutoBuf() { delete [] buffer; }
   char *buffer;
};

static value escape( value o, value s ) {
	int len;
	val_check_kind(o,k_mysql_connection);
	val_check(s,string);
	len = val_strlen(s) * 2 + 1;
   AutoBuf sout(len);
	len = mysql_real_escape_string(CNX(o)->m,sout.buffer,val_string(s),val_strlen(s));
	if( len < 0 ) {
		buffer b = alloc_buffer("Unsupported charset : ");
		buffer_append(b,mysql_character_set_name(CNX(o)->m));
		bfailure(b);
	}
	return alloc_string_len(sout.buffer,len);
}

/**
	set_conv_funs : 'connection -> function:1 -> function:1 -> function:1 -> void
	<doc>Set three wrapper methods to be be called when creating a string, a date, and binary data in results</doc>
**/
static value set_conv_funs( value o, value fstring, value fdate, value fbytes ) {
	val_check_kind(o,k_mysql_connection);
	val_check_function(fstring,1);
	val_check_function(fdate,1);
	val_check_function(fbytes,1);
	CNX(o)->conv_string = fstring;
	CNX(o)->conv_date = fdate;
	CNX(o)->conv_bytes = fbytes;
	return val_null;
}

// ---------------------------------------------------------------
// Sql


static void free_connection( value o ) {
	mysql_close(CNX(o)->m);
}

/**
	connect : { host => string, port => int, user => string, pass => string, socket => string? } -> 'connection
	<doc>Connect to a database using the connection informations</doc>
**/
static value mysql_connect( value params  ) {
	value host, port, user, pass, socket;
	val_check(params,object);
	host = val_field(params,val_id("host"));
	port = val_field(params,val_id("port"));
	user = val_field(params,val_id("user"));
	pass = val_field(params,val_id("pass"));
	socket = val_field(params,val_id("socket"));
	val_check(host,string);
	val_check(port,int);
	val_check(user,string);
	val_check(pass,string);
	if( !val_is_string(socket) && !val_is_null(socket) )
		neko_error();
	{
		MYSQL *cnx = mysql_init(NULL);
		if( mysql_real_connect(cnx,val_string(host),val_string(user),val_string(pass),NULL,val_int(port),val_is_null(socket)?NULL:val_string(socket),0) == NULL ) {
			buffer b = alloc_buffer("Failed to connect to mysql server : ");
			buffer_append(b,mysql_error(cnx));
			mysql_close(cnx);
			bfailure(b);
		}

		value v = create_abstract(k_mysql_connection,sizeof(connection),free_connection);
		connection *c = CNX(v);
		c->m = cnx;
		return v;
	}
}

// ---------------------------------------------------------------
// Registers

DEFINE_PRIM(mysql_connect,1);
DEFINE_LIB_PRIM("mysql",close,1);
DEFINE_LIB_PRIM("mysql",request,2);
DEFINE_LIB_PRIM("mysql",select_db,2);
DEFINE_LIB_PRIM("mysql",escape,2);

DEFINE_LIB_PRIM("mysql",result_get_length,1);
DEFINE_LIB_PRIM("mysql",result_get_nfields,1);
DEFINE_LIB_PRIM("mysql",result_get_fields_names,1);
DEFINE_LIB_PRIM("mysql",result_next,1);
DEFINE_LIB_PRIM("mysql",result_get,2);
DEFINE_LIB_PRIM("mysql",result_get_int,2);
DEFINE_LIB_PRIM("mysql",result_get_float,2);
DEFINE_LIB_PRIM("mysql",result_set_conv_date,2);

DEFINE_LIB_PRIM("mysql",set_conv_funs,4);

/* ************************************************************************ */

}


extern "C" int mysql_register_prims()
{
   return 0;
}



