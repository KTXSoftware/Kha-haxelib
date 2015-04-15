#include "pch.h"
#include "Image.h"
#include <Kore/IO/FileReader.h>
#include <Kore/Graphics/Graphics.h>
#include "stb_image.h"
#include <stdio.h>
#include <string.h>

using namespace Kore;

namespace {
	bool endsWith(const char* str, const char* suffix) {
		if (!str || !suffix) return 0;
		size_t lenstr = strlen(str);
		size_t lensuffix = strlen(suffix);
		if (lensuffix > lenstr) return 0;
		return strncmp(str + lenstr - lensuffix, suffix, lensuffix) == 0;
	}
}

int Image::sizeOf(Image::Format format) {
	switch (format) {
	case Image::RGBA32:
		return 4;
	case Image::Grey8:
		return 1;
	}
	return -1;
}

Image::Image(int width, int height, Format format, bool readable) : width(width), height(height), format(format), readable(readable) {
	compressed = false;
	data = new u8[width * height * sizeOf(format)];
}

Image::Image(const char* filename, bool readable) : format(RGBA32), readable(readable) {
	printf("Image %s\n", filename);
	FileReader file(filename);
	if (endsWith(filename, ".pvr")) {
		u32 version = file.readU32LE();
		u32 flags = file.readU32LE();
		u64 pixelFormat1 = file.readU64LE();
		u32 colourSpace = file.readU32LE();
		u32 channelType = file.readU32LE();
		u32 height = file.readU32LE();
		u32 width = file.readU32LE();
		u32 depth = file.readU32LE();
		u32 numSurfaces = file.readU32LE();
		u32 numFaces = file.readU32LE();
		u32 mipMapCount = file.readU32LE();
		u32 metaDataSize = file.readU32LE();
		
		u32 meta1fourcc = file.readU32LE();
		u32 meta1key = file.readU32LE();
		u32 meta1size = file.readU32LE();
		u32 meta1data = file.readU32LE();
		
		u32 meta2fourcc = file.readU32LE();
		u32 meta2key = file.readU32LE();
		u32 meta2size = file.readU32LE();
		u32 meta2data = file.readU32LE();
		
		int w = 0;
		int h = 0;
		
		if (meta1fourcc == 0) w = meta1data;
		if (meta1fourcc == 1) h = meta1data;
		if (meta2fourcc == 0) w = meta2data;
		if (meta2fourcc == 1) h = meta2data;
		
		this->width = w;
		this->height = h;
		compressed = true;
		
		u8* all = (u8*)file.readAll();
		data = new u8[width * height / 2];
		for (unsigned i = 0; i < width * height / 2; ++i) {
			data[i] = all[52 + metaDataSize + i];
		}
	}
	else {
		int size = file.size();
		int comp;
		compressed = false;
		data = stbi_load_from_memory((u8*)file.readAll(), size, &width, &height, &comp, 4);
	}
}

Image::~Image() {
	delete[] data;
}

int Image::at(int x, int y) {
	return *(int*)&((u8*)data)[width * sizeOf(format) * y + x * sizeOf(format)];
}
