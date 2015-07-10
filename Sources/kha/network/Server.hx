package kha.networking;

import haxe.io.Bytes;
#if node
import js.Node;
import js.node.Buffer;
import js.node.Dgram;
import js.support.Error;
#end

class Server {
	#if node
	private var webSocket: Dynamic;
	private var udpSocket: DgramSocket;
	private var lastId: Int = -1;
	#end

	public function new(port: Int) {
		#if node
		var WebSocketServer = Node.require("ws").Server;
		webSocket = untyped __js__("new WebSocketServer({ port: port })");
		
		udpSocket = Dgram.createSocket("udp4", function (error: Error, bytes: Bytes) { });
		udpSocket.bind(port + 1);
		#end
	}
	
	public function onConnection(connection: Client->Void): Void {
		#if node
		webSocket.on("connection", function (socket: Dynamic) {
			++lastId;
			connection(new WebSocketClient(lastId, socket));
		});
		
		udpSocket.on('message', function(message: Buffer, info) {
			if (compare(message, "JOIN")) {
				++lastId;
				connection(new UdpClient(lastId, udpSocket, info.address, info.port));
			}
			//console.log('Received %d bytes from %s:%d\n', message.length, info.address, info.port);
		});
		#end
	}
	
	#if node
	private static function compare(buffer: Buffer, message: String): Bool {
		if (buffer.length != message.length) return false;
		for (i in 0...buffer.length) {
			if (buffer.readUInt8(i) != message.charCodeAt(i)) return false;
		}
		return true;
	}
	#end
}
