/**
 * Copyright (c) Nicolas Gallagher.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
var dataUriPattern = /^data:/;
export class ImageUriCache {
  static has(uri) {
    var entries = ImageUriCache._entries;
    var isDataUri = dataUriPattern.test(uri);
    return isDataUri || Boolean(entries[uri]);
  }

  static add(uri) {
    var entries = ImageUriCache._entries;
    var lastUsedTimestamp = Date.now();

    if (entries[uri]) {
      entries[uri].lastUsedTimestamp = lastUsedTimestamp;
      entries[uri].refCount += 1;
    } else {
      entries[uri] = {
        lastUsedTimestamp,
        refCount: 1
      };
    }
  }

  static remove(uri) {
    var entries = ImageUriCache._entries;

    if (entries[uri]) {
      entries[uri].refCount -= 1;
    } // Free up entries when the cache is "full"


    ImageUriCache._cleanUpIfNeeded();
  }

  static _cleanUpIfNeeded() {
    var entries = ImageUriCache._entries;
    var imageUris = Object.keys(entries);

    if (imageUris.length + 1 > ImageUriCache._maximumEntries) {
      var leastRecentlyUsedKey;
      var leastRecentlyUsedEntry;
      imageUris.forEach(uri => {
        var entry = entries[uri];

        if ((!leastRecentlyUsedEntry || entry.lastUsedTimestamp < leastRecentlyUsedEntry.lastUsedTimestamp) && entry.refCount === 0) {
          leastRecentlyUsedKey = uri;
          leastRecentlyUsedEntry = entry;
        }
      });

      if (leastRecentlyUsedKey) {
        delete entries[leastRecentlyUsedKey];
      }
    }
  }

}
ImageUriCache._maximumEntries = 256;
ImageUriCache._entries = {};
var id = 0;
var requests = {};
var ImageLoader = {
  clear(requestId) {
    var image = requests["" + requestId];

    if (image) {
      image.onerror = null;
      image.onload = null;
      ImageUriCache.remove(image.src);
      image.src = '';
      delete requests["" + requestId];
    }
  },

  getSize(uri, success, failure) {
    var complete = false;
    var interval = setInterval(callback, 16);
    var requestId = ImageLoader.load(uri, callback, errorCallback);

    function callback() {
      var image = requests["" + requestId];

      if (image) {
        var naturalHeight = image.naturalHeight,
            naturalWidth = image.naturalWidth;

        if (naturalHeight && naturalWidth) {
          success(naturalWidth, naturalHeight);
          complete = true;
        }
      }

      if (complete) {
        ImageLoader.clear(requestId);
        clearInterval(interval);
      }
    }

    function errorCallback() {
      if (typeof failure === 'function') {
        failure();
      }

      ImageLoader.clear(requestId);
      clearInterval(interval);
    }
  },

  has(uri) {
    return ImageUriCache.has(uri);
  },

  load(uri, onLoad, onError) {
    id += 1;
    var image = new window.Image();
    image.onerror = onError;

    image.onload = nativeEvent => {
      ImageUriCache.add(uri); // avoid blocking the main thread

      var onDecode = () => {
        // Append `source` to match RN's ImageLoadEvent interface
        nativeEvent.source = {
          uri: image.src,
          width: image.naturalWidth,
          height: image.naturalHeight
        };
        onLoad({
          nativeEvent
        });
      };

      if (typeof image.decode === 'function') {
        // Safari currently throws exceptions when decoding svgs.
        // We want to catch that error and allow the load handler
        // to be forwarded to the onLoad handler in this case
        image.decode().then(onDecode, onDecode);
      } else {
        setTimeout(onDecode, 0);
      }
    };

    image.src = uri;
    requests["" + id] = image;
    return id;
  },

  loadWithHeaders(source) {
    var uri;
    var abortController = new AbortController();
    var request = new Request(source.uri, {
      headers: source.headers,
      signal: abortController.signal
    });
    request.headers.append('accept', 'image/*');
    var promise = fetch(request).then(response => response.blob()).then(blob => {
      uri = URL.createObjectURL(blob);
      return uri;
    }).catch(error => {
      if (error.name === 'AbortError') {
        return '';
      }

      throw error;
    });
    return {
      promise,
      source,
      cancel: () => {
        abortController.abort();
        URL.revokeObjectURL(uri);
      }
    };
  },

  prefetch(uri) {
    return new Promise((resolve, reject) => {
      ImageLoader.load(uri, () => {
        // load() adds the uri to the cache so it can be immediately displayed when used,
        // but we also immediately remove it to correctly reflect that it has no active references
        ImageUriCache.remove(uri);
        resolve();
      }, reject);
    });
  },

  queryCache(uris) {
    var result = {};
    uris.forEach(u => {
      if (ImageUriCache.has(u)) {
        result[u] = 'disk/memory';
      }
    });
    return Promise.resolve(result);
  }

};
export default ImageLoader;