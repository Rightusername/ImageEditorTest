
export class Filters {

    utils = {
        initSampleCanvas: function () {
            var _canvas = document.createElement('canvas'),
                _context = _canvas.getContext('2d');
    
            _canvas.width = 0;
            _canvas.height = 0;
    
            this.getSampleCanvas = function () {
                return _canvas;
            };
            this.getSampleContext = function () {
                return _context;
            };
            this.createImageData = (_context.createImageData) ? function (w, h) {
                    return _context.createImageData(w, h);
                } : function (w, h) {
                    return new ImageData(w, h);
                };
        },
        getSampleCanvas: function () {
            this.initSampleCanvas();
            return this.getSampleCanvas();
        },
        getSampleContext: function () {
            this.initSampleCanvas();
            return this.getSampleContext();
        },
        createImageData: function (w, h) {
            this.initSampleCanvas();
            return this.createImageData(w, h);
        },
        clamp: function (value) {
            return value > 255 ? 255 : value < 0 ? 0 : value;
        },
        buildMap: function (f) {
            for (var m = [], k = 0, v; k < 256; k += 1) {
                m[k] = (v = f(k)) > 255 ? 255 : v < 0 ? 0 : v | 0;
            }
            return m;
        },
        applyMap: function (src, dst, map) {
            for (var i = 0, l = src.length; i < l; i += 4) {
                dst[i]     = map[src[i]];
                dst[i + 1] = map[src[i + 1]];
                dst[i + 2] = map[src[i + 2]];
                dst[i + 3] = src[i + 3];
            }
        },
        mapRGB: function (src, dst, func) {
            this.applyMap(src, dst, this.buildMap(func));
        },
        getPixelIndex: function (x, y, width, height, edge) {
            if (x < 0 || x >= width || y < 0 || y >= height) {
                switch (edge) {
                case 1: // clamp
                    x = x < 0 ? 0 : x >= width ? width - 1 : x;
                    y = y < 0 ? 0 : y >= height ? height - 1 : y;
                    break;
                case 2: // wrap
                    x = (x %= width) < 0 ? x + width : x;
                    y = (y %= height) < 0 ? y + height : y;
                    break;
                default: // transparent
                    return null;
                }
            }
            return (y * width + x) << 2;
        },
        getPixel: function (src, x, y, width, height, edge) {
            if (x < 0 || x >= width || y < 0 || y >= height) {
                switch (edge) {
                case 1: // clamp
                    x = x < 0 ? 0 : x >= width ? width - 1 : x;
                    y = y < 0 ? 0 : y >= height ? height - 1 : y;
                    break;
                case 2: // wrap
                    x = (x %= width) < 0 ? x + width : x;
                    y = (y %= height) < 0 ? y + height : y;
                    break;
                default: // transparent
                    return 0;
                }
            }
    
            var i = (y * width + x) << 2;
    
            // ARGB
            return src[i + 3] << 24 | src[i] << 16 | src[i + 1] << 8 | src[i + 2];
        },
        getPixelByIndex: function (src, i) {
            return src[i + 3] << 24 | src[i] << 16 | src[i + 1] << 8 | src[i + 2];
        },
        /**
         * one of the most important functions in this library.
         * I want to make this as fast as possible.
         */
        copyBilinear: function (src, x, y, width, height, dst, dstIndex, edge) {
            var fx = x < 0 ? x - 1 | 0 : x | 0, // Math.floor(x)
                fy = y < 0 ? y - 1 | 0 : y | 0, // Math.floor(y)
                wx = x - fx,
                wy = y - fy,
                i,
                nw = 0, ne = 0, sw = 0, se = 0,
                cx, cy,
                r, g, b, a;
    
            if (fx >= 0 && fx < (width - 1) && fy >= 0 && fy < (height - 1)) {
                // in bounds, no edge actions required
                i = (fy * width + fx) << 2;
    
                if (wx || wy) {
                    nw = src[i + 3] << 24 | src[i] << 16 | src[i + 1] << 8 | src[i + 2];
    
                    i += 4;
                    ne = src[i + 3] << 24 | src[i] << 16 | src[i + 1] << 8 | src[i + 2];
    
                    i = (i - 8) + (width << 2);
                    sw = src[i + 3] << 24 | src[i] << 16 | src[i + 1] << 8 | src[i + 2];
    
                    i += 4;
                    se = src[i + 3] << 24 | src[i] << 16 | src[i + 1] << 8 | src[i + 2];
                }
                else {
                    // no interpolation required
                    dst[dstIndex]     = src[i];
                    dst[dstIndex + 1] = src[i + 1];
                    dst[dstIndex + 2] = src[i + 2];
                    dst[dstIndex + 3] = src[i + 3];
                    return;
                }
            }
            else {
                // edge actions required
                nw = this.getPixel(src, fx, fy, width, height, edge);
    
                if (wx || wy) {
                    ne = this.getPixel(src, fx + 1, fy, width, height, edge);
                    sw = this.getPixel(src, fx, fy + 1, width, height, edge);
                    se = this.getPixel(src, fx + 1, fy + 1, width, height, edge);
                }
                else {
                    // no interpolation required
                    dst[dstIndex]     = nw >> 16 & 0xFF;
                    dst[dstIndex + 1] = nw >> 8  & 0xFF;
                    dst[dstIndex + 2] = nw       & 0xFF;
                    dst[dstIndex + 3] = nw >> 24 & 0xFF;
                    return;
                }
            }
    
            cx = 1 - wx;
            cy = 1 - wy;
            r = ((nw >> 16 & 0xFF) * cx + (ne >> 16 & 0xFF) * wx) * cy + ((sw >> 16 & 0xFF) * cx + (se >> 16 & 0xFF) * wx) * wy;
            g = ((nw >> 8  & 0xFF) * cx + (ne >> 8  & 0xFF) * wx) * cy + ((sw >> 8  & 0xFF) * cx + (se >> 8  & 0xFF) * wx) * wy;
            b = ((nw       & 0xFF) * cx + (ne       & 0xFF) * wx) * cy + ((sw       & 0xFF) * cx + (se       & 0xFF) * wx) * wy;
            a = ((nw >> 24 & 0xFF) * cx + (ne >> 24 & 0xFF) * wx) * cy + ((sw >> 24 & 0xFF) * cx + (se >> 24 & 0xFF) * wx) * wy;
    
            dst[dstIndex]     = r > 255 ? 255 : r < 0 ? 0 : r | 0;
            dst[dstIndex + 1] = g > 255 ? 255 : g < 0 ? 0 : g | 0;
            dst[dstIndex + 2] = b > 255 ? 255 : b < 0 ? 0 : b | 0;
            dst[dstIndex + 3] = a > 255 ? 255 : a < 0 ? 0 : a | 0;
        },
        /**
         * @param r 0 <= n <= 255
         * @param g 0 <= n <= 255
         * @param b 0 <= n <= 255
         * @return Array(h, s, l)
         */
        rgbToHsl: function (r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
    
    //        var max = Math.max(r, g, b),
    //            min = Math.min(r, g, b),
            var max = (r > g) ? (r > b) ? r : b : (g > b) ? g : b,
                min = (r < g) ? (r < b) ? r : b : (g < b) ? g : b,
                chroma = max - min,
                h = 0,
                s = 0,
                // Lightness
                l = (min + max) / 2;
    
            if (chroma !== 0) {
                // Hue
                if (r === max) {
                    h = (g - b) / chroma + ((g < b) ? 6 : 0);
                }
                else if (g === max) {
                    h = (b - r) / chroma + 2;
                }
                else {
                    h = (r - g) / chroma + 4;
                }
                h /= 6;
    
                // Saturation
                s = (l > 0.5) ? chroma / (2 - max - min) : chroma / (max + min);
            }
    
            return [h, s, l];
        },
        /**
         * @param h 0.0 <= n <= 1.0
         * @param s 0.0 <= n <= 1.0
         * @param l 0.0 <= n <= 1.0
         * @return Array(r, g, b)
         */
        hslToRgb: function (h, s, l) {
            var m1, m2, hue,
                r, g, b,
                rgb = [];
    
            if (s === 0) {
                r = g = b = l * 255 + 0.5 | 0;
                rgb = [r, g, b];
            }
            else {
                if (l <= 0.5) {
                    m2 = l * (s + 1);
                }
                else {
                    m2 = l + s - l * s;
                }
    
                m1 = l * 2 - m2;
                hue = h + 1 / 3;
    
                var tmp;
                for (var i = 0; i < 3; i += 1) {
                    if (hue < 0) {
                        hue += 1;
                    }
                    else if (hue > 1) {
                        hue -= 1;
                    }
    
                    if (6 * hue < 1) {
                        tmp = m1 + (m2 - m1) * hue * 6;
                    }
                    else if (2 * hue < 1) {
                        tmp = m2;
                    }
                    else if (3 * hue < 2) {
                        tmp = m1 + (m2 - m1) * (2 / 3 - hue) * 6;
                    }
                    else {
                        tmp = m1;
                    }
    
                    rgb[i] = tmp * 255 + 0.5 | 0;
    
                    hue -= 1 / 3;
                }
            }
    
            return rgb;
        }
    };

    Mosaic(context, blockSize = 10) {
        let srcImageData = context.getImageData( 0,0, context.canvas.width, context.canvas.height );
        var srcPixels    = srcImageData.data,
            srcWidth     = srcImageData.width,
            srcHeight    = srcImageData.height,
            srcLength    = srcPixels.length,
            dstImageData = this.utils.createImageData(srcWidth, srcHeight),
            dstPixels    = dstImageData.data;
    
        var cols = Math.ceil(srcWidth / blockSize),
            rows = Math.ceil(srcHeight / blockSize),
            row, col,
            x_start, x_end, y_start, y_end,
            x, y, yIndex, index, size,
            r, g, b, a;
    
        for (row = 0; row < rows; row += 1) {
            y_start = row * blockSize;
            y_end   = y_start + blockSize;
    
            if (y_end > srcHeight) {
                y_end = srcHeight;
            }
    
            for (col = 0; col < cols; col += 1) {
                x_start = col * blockSize;
                x_end   = x_start + blockSize;
    
                if (x_end > srcWidth) {
                    x_end = srcWidth;
                }
    
                // get the average color from the src
                r = g = b = a = 0;
                size = (x_end - x_start) * (y_end - y_start);
    
                for (y = y_start; y < y_end; y += 1) {
                    yIndex = y * srcWidth;
    
                    for (x = x_start; x < x_end; x += 1) {
                        index = (yIndex + x) << 2;
                        r += srcPixels[index];
                        g += srcPixels[index + 1];
                        b += srcPixels[index + 2];
                        a += srcPixels[index + 3];
                    }
                }
    
                r = (r / size) + 0.5 | 0;
                g = (g / size) + 0.5 | 0;
                b = (b / size) + 0.5 | 0;
                a = (a / size) + 0.5 | 0;
    
                // fill the dst with that color
                for (y = y_start; y < y_end; y += 1) {
                    yIndex = y * srcWidth;
    
                    for (x = x_start; x < x_end; x += 1) {
                        index = (yIndex + x) << 2;
                        dstPixels[index]     = r;
                        dstPixels[index + 1] = g;
                        dstPixels[index + 2] = b;
                        dstPixels[index + 3] = a;
                    }
                }
            }
        }
    
        return dstImageData;
        //context.putImageData(dstImageData, 0, 0);
    };

    Grayness(context){
        let imageData = context.getImageData( 0,0, context.canvas.width, context.canvas.height );
        let px = imageData.data;
        for (var i=0; i<px.length; i+=4) {
            var r = px[i];
            var g = px[i+1];
            var b =px[i+2];
            var v = 0.2126*r + 0.7152*g + 0.0722*b;
            px[i] =px[i+1] = px[i+2] = v
        }
        return imageData;
        //context.putImageData(imageData, 0, 0);
    }


    Brightness(context, brightness = 20) {
        let srcImageData = context.getImageData( 0,0, context.canvas.width, context.canvas.height );
        var srcPixels    = srcImageData.data,
        srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        srcLength    = srcPixels.length,
        dstImageData = this.utils.createImageData(srcWidth, srcHeight),
        dstPixels    = dstImageData.data;

        this.utils.mapRGB(srcPixels, dstPixels, function (value) {
            value += brightness;
            return (value > 255) ? 255 : value;
        });

        return dstImageData;
        //context.putImageData(dstImageData, 0, 0);
    };

    Desaturate(context) {
        let srcImageData = context.getImageData( 0,0, context.canvas.width, context.canvas.height );
        var srcPixels    = srcImageData.data,
            srcWidth     = srcImageData.width,
            srcHeight    = srcImageData.height,
            srcLength    = srcPixels.length,
            dstImageData = this.utils.createImageData(srcWidth, srcHeight),
            dstPixels    = dstImageData.data;
    
        for (var i = 0; i < srcLength; i += 4) {
            var r = srcPixels[i],
                g = srcPixels[i + 1],
                b = srcPixels[i + 2],
                max = (r > g) ? (r > b) ? r : b : (g > b) ? g : b,
                min = (r < g) ? (r < b) ? r : b : (g < b) ? g : b,
                avg = ((max + min) / 2) + 0.5 | 0;
    
            dstPixels[i] = dstPixels[i + 1] = dstPixels[i + 2] = avg;
            dstPixels[i + 3] = srcPixels[i + 3];
        }
        return dstImageData;
        //context.putImageData(dstImageData, 0, 0);
    };

    Copy(srcImageData, dstImageData) {
        var srcPixels = srcImageData.data,
            srcLength = srcPixels.length,
            dstPixels = dstImageData.data;
    
        while (srcLength--) {
            dstPixels[srcLength] = srcPixels[srcLength];
        }
    
        return dstImageData;
    };

    Clone(srcImageData) {
        return this.Copy(srcImageData, this.utils.createImageData(srcImageData.width, srcImageData.height));
    };
    

    DisplacementMapFilter(context, levels = 4) {
        let srcImageData = context.getImageData( 0,0, context.canvas.width, context.canvas.height );
        var srcWidth     = srcImageData.width,
        srcHeight    = srcImageData.height,
        dstImageData = this.Clone(srcImageData),
        dstPixels    = dstImageData.data;

        levels = levels < 2 ? 2 : levels > 255 ? 255 : levels;

        // Build a color map using the same algorithm as the posterize filter.
        var posterize,
            levelMap = [],
            levelsMinus1 = levels - 1,
            j = 0,
            k = 0,
            i;

        for (i = 0; i < levels; i += 1) {
            levelMap[i] = (255 * i) / levelsMinus1;
        }

        posterize = this.utils.buildMap(function (value) {
            var ret = levelMap[j];

            k += levels;

            if (k > 255) {
                k -= 255;
                j += 1;
            }

            return ret;
        });

        // Apply the dithering algorithm to each pixel
        var x, y,
            index,
            old_r, old_g, old_b,
            new_r, new_g, new_b,
            err_r, err_g, err_b,
            nbr_r, nbr_g, nbr_b,
            srcWidthMinus1 = srcWidth - 1,
            srcHeightMinus1 = srcHeight - 1,
            A = 7 / 16,
            B = 3 / 16,
            C = 5 / 16,
            D = 1 / 16;

        for (y = 0; y < srcHeight; y += 1) {
            for (x = 0; x < srcWidth; x += 1) {
                // Get the current pixel.
                index = (y * srcWidth + x) << 2;

                old_r = dstPixels[index];
                old_g = dstPixels[index + 1];
                old_b = dstPixels[index + 2];

                // Quantize using the color map
                new_r = posterize[old_r];
                new_g = posterize[old_g];
                new_b = posterize[old_b];

                // Set the current pixel.
                dstPixels[index]     = new_r;
                dstPixels[index + 1] = new_g;
                dstPixels[index + 2] = new_b;

                // Quantization errors
                err_r = old_r - new_r;
                err_g = old_g - new_g;
                err_b = old_b - new_b;

                // Apply the matrix.
                // x + 1, y
                index += 1 << 2;
                if (x < srcWidthMinus1) {
                    nbr_r = dstPixels[index]     + A * err_r;
                    nbr_g = dstPixels[index + 1] + A * err_g;
                    nbr_b = dstPixels[index + 2] + A * err_b;

                    dstPixels[index]     = nbr_r > 255 ? 255 : nbr_r < 0 ? 0 : nbr_r | 0;
                    dstPixels[index + 1] = nbr_g > 255 ? 255 : nbr_g < 0 ? 0 : nbr_g | 0;
                    dstPixels[index + 2] = nbr_b > 255 ? 255 : nbr_b < 0 ? 0 : nbr_b | 0;
                }

                // x - 1, y + 1
                index += (srcWidth - 2) << 2;
                if (x > 0 && y < srcHeightMinus1) {
                    nbr_r = dstPixels[index]     + B * err_r;
                    nbr_g = dstPixels[index + 1] + B * err_g;
                    nbr_b = dstPixels[index + 2] + B * err_b;

                    dstPixels[index]     = nbr_r > 255 ? 255 : nbr_r < 0 ? 0 : nbr_r | 0;
                    dstPixels[index + 1] = nbr_g > 255 ? 255 : nbr_g < 0 ? 0 : nbr_g | 0;
                    dstPixels[index + 2] = nbr_b > 255 ? 255 : nbr_b < 0 ? 0 : nbr_b | 0;
                }

                // x, y + 1
                index += 1 << 2;
                if (y < srcHeightMinus1) {
                    nbr_r = dstPixels[index]     + C * err_r;
                    nbr_g = dstPixels[index + 1] + C * err_g;
                    nbr_b = dstPixels[index + 2] + C * err_b;

                    dstPixels[index]     = nbr_r > 255 ? 255 : nbr_r < 0 ? 0 : nbr_r | 0;
                    dstPixels[index + 1] = nbr_g > 255 ? 255 : nbr_g < 0 ? 0 : nbr_g | 0;
                    dstPixels[index + 2] = nbr_b > 255 ? 255 : nbr_b < 0 ? 0 : nbr_b | 0;
                }

                // x + 1, y + 1
                index += 1 << 2;
                if (x < srcWidthMinus1 && y < srcHeightMinus1) {
                    nbr_r = dstPixels[index]     + D * err_r;
                    nbr_g = dstPixels[index + 1] + D * err_g;
                    nbr_b = dstPixels[index + 2] + D * err_b;

                    dstPixels[index]     = nbr_r > 255 ? 255 : nbr_r < 0 ? 0 : nbr_r | 0;
                    dstPixels[index + 1] = nbr_g > 255 ? 255 : nbr_g < 0 ? 0 : nbr_g | 0;
                    dstPixels[index + 2] = nbr_b > 255 ? 255 : nbr_b < 0 ? 0 : nbr_b | 0;
                }
            }
        }

        return dstImageData;
        //context.putImageData(dstImageData, 0, 0);
    };

    Flip(context, vertical) {
        let srcImageData = context.getImageData( 0,0, context.canvas.width, context.canvas.height );
        var srcPixels    = srcImageData.data,
            srcWidth     = srcImageData.width,
            srcHeight    = srcImageData.height,
            srcLength    = srcPixels.length,
            dstImageData = this.utils.createImageData(srcWidth, srcHeight),
            dstPixels    = dstImageData.data;
    
        var x, y, srcIndex, dstIndex, i;
    
        for (y = 0; y < srcHeight; y += 1) {
            for (x = 0; x < srcWidth; x += 1) {
                srcIndex = (y * srcWidth + x) << 2;
                if (vertical) {
                    dstIndex = ((srcHeight - y - 1) * srcWidth + x) << 2;
                }
                else {
                    dstIndex = (y * srcWidth + (srcWidth - x - 1)) << 2;
                }
    
                dstPixels[dstIndex]     = srcPixels[srcIndex];
                dstPixels[dstIndex + 1] = srcPixels[srcIndex + 1];
                dstPixels[dstIndex + 2] = srcPixels[srcIndex + 2];
                dstPixels[dstIndex + 3] = srcPixels[srcIndex + 3];
            }
        }
        return dstImageData;
        //context.putImageData(dstImageData, 0, 0);

    };
    
    Gamma(context, gamma=3) {
        let srcImageData = context.getImageData( 0,0, context.canvas.width, context.canvas.height );
        var srcPixels    = srcImageData.data,
            srcWidth     = srcImageData.width,
            srcHeight    = srcImageData.height,
            srcLength    = srcPixels.length,
            dstImageData = this.utils.createImageData(srcWidth, srcHeight),
            dstPixels    = dstImageData.data;
    
        this.utils.mapRGB(srcPixels, dstPixels, function (value) {
            value = (255 * Math.pow(value / 255, 1 / gamma) + 0.5);
            return value > 255 ? 255 : value + 0.5 | 0;
        });
        return dstImageData;
        //context.putImageData(dstImageData, 0, 0);
    };

    Invert(context) {
        let srcImageData = context.getImageData( 0,0, context.canvas.width, context.canvas.height );
        var srcPixels    = srcImageData.data,
            srcWidth     = srcImageData.width,
            srcHeight    = srcImageData.height,
            srcLength    = srcPixels.length,
            dstImageData = this.utils.createImageData(srcWidth, srcHeight),
            dstPixels    = dstImageData.data;
    
        this.utils.mapRGB(srcPixels, dstPixels, function (value) {
            return 255 - value;
        });
        return dstImageData;
        //context.putImageData(dstImageData, 0, 0);
    };

}