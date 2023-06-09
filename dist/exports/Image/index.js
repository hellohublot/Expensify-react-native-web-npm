import _objectSpread from "@babel/runtime/helpers/objectSpread2";
import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
var _excluded = ["accessibilityLabel", "blurRadius", "defaultSource", "draggable", "onError", "onLayout", "onLoad", "onLoadEnd", "onLoadStart", "pointerEvents", "source", "style"];

/**
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
import * as React from 'react';
import createElement from '../createElement';
import { getAssetByID } from '../../modules/AssetRegistry';
import { createBoxShadowValue } from '../StyleSheet/preprocess';
import ImageLoader from '../../modules/ImageLoader';
import PixelRatio from '../PixelRatio';
import StyleSheet from '../StyleSheet';
import TextAncestorContext from '../Text/TextAncestorContext';
import View from '../View';
var ERRORED = 'ERRORED';
var LOADED = 'LOADED';
var LOADING = 'LOADING';
var IDLE = 'IDLE';
var _filterId = 0;
var svgDataUriPattern = /^(data:image\/svg\+xml;utf8,)(.*)/;

function createTintColorSVG(tintColor, id) {
  return tintColor && id != null ? /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      height: 0,
      visibility: 'hidden',
      width: 0
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("filter", {
    id: "tint-" + id,
    suppressHydrationWarning: true
  }, /*#__PURE__*/React.createElement("feFlood", {
    floodColor: "" + tintColor,
    key: tintColor
  }), /*#__PURE__*/React.createElement("feComposite", {
    in2: "SourceAlpha",
    operator: "atop"
  })))) : null;
}

function getFlatStyle(style, blurRadius, filterId) {
  var flatStyle = StyleSheet.flatten(style);
  var filter = flatStyle.filter,
      resizeMode = flatStyle.resizeMode,
      shadowOffset = flatStyle.shadowOffset,
      tintColor = flatStyle.tintColor; // Add CSS filters
  // React Native exposes these features as props and proprietary styles

  var filters = [];
  var _filter = null;

  if (filter) {
    filters.push(filter);
  }

  if (blurRadius) {
    filters.push("blur(" + blurRadius + "px)");
  }

  if (shadowOffset) {
    var shadowString = createBoxShadowValue(flatStyle);

    if (shadowString) {
      filters.push("drop-shadow(" + shadowString + ")");
    }
  }

  if (tintColor && filterId != null) {
    filters.push("url(#tint-" + filterId + ")");
  }

  if (filters.length > 0) {
    _filter = filters.join(' ');
  } // These styles are converted to CSS filters applied to the
  // element displaying the background image.


  delete flatStyle.blurRadius;
  delete flatStyle.shadowColor;
  delete flatStyle.shadowOpacity;
  delete flatStyle.shadowOffset;
  delete flatStyle.shadowRadius;
  delete flatStyle.tintColor; // These styles are not supported on View

  delete flatStyle.overlayColor;
  delete flatStyle.resizeMode;
  return [flatStyle, resizeMode, _filter, tintColor];
}

function resolveAssetDimensions(source) {
  if (typeof source === 'number') {
    var _getAssetByID = getAssetByID(source),
        _height = _getAssetByID.height,
        _width = _getAssetByID.width;

    return {
      height: _height,
      width: _width
    };
  } else if (source != null && !Array.isArray(source) && typeof source === 'object') {
    var _height2 = source.height,
        _width2 = source.width;
    return {
      height: _height2,
      width: _width2
    };
  }
}

function resolveAssetUri(source) {
  var uri = null;

  if (typeof source === 'number') {
    // get the URI from the packager
    var asset = getAssetByID(source);

    if (asset == null) {
      throw new Error("Image: asset with ID \"" + source + "\" could not be found. Please check the image source or packager.");
    }

    var scale = asset.scales[0];

    if (asset.scales.length > 1) {
      var preferredScale = PixelRatio.get(); // Get the scale which is closest to the preferred scale

      scale = asset.scales.reduce((prev, curr) => Math.abs(curr - preferredScale) < Math.abs(prev - preferredScale) ? curr : prev);
    }

    var scaleSuffix = scale !== 1 ? "@" + scale + "x" : '';
    uri = asset ? asset.httpServerLocation + "/" + asset.name + scaleSuffix + "." + asset.type : '';
  } else if (typeof source === 'string') {
    uri = source;
  } else if (source && typeof source.uri === 'string') {
    uri = source.uri;
  }

  if (uri) {
    var match = uri.match(svgDataUriPattern); // inline SVG markup may contain characters (e.g., #, ") that need to be escaped

    if (match) {
      var prefix = match[1],
          svg = match[2];
      var encodedSvg = encodeURIComponent(svg);
      return "" + prefix + encodedSvg;
    }
  }

  return uri;
}

function raiseOnErrorEvent(uri, _ref) {
  var onError = _ref.onError,
      onLoadEnd = _ref.onLoadEnd;

  if (onError) {
    onError({
      nativeEvent: {
        error: "Failed to load resource " + uri + " (404)"
      }
    });
  }

  if (onLoadEnd) onLoadEnd();
}

function hasSourceDiff(a, b) {
  return a.uri !== b.uri || JSON.stringify(a.headers) !== JSON.stringify(b.headers);
}

var BaseImage = /*#__PURE__*/React.forwardRef((props, ref) => {
  var accessibilityLabel = props.accessibilityLabel,
      blurRadius = props.blurRadius,
      defaultSource = props.defaultSource,
      draggable = props.draggable,
      onError = props.onError,
      onLayout = props.onLayout,
      onLoad = props.onLoad,
      onLoadEnd = props.onLoadEnd,
      onLoadStart = props.onLoadStart,
      pointerEvents = props.pointerEvents,
      source = props.source,
      style = props.style,
      rest = _objectWithoutPropertiesLoose(props, _excluded);

  if (process.env.NODE_ENV !== 'production') {
    if (props.children) {
      throw new Error('The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.');
    }
  }

  var _React$useState = React.useState(IDLE),
      state = _React$useState[0],
      updateState = _React$useState[1];

  var _React$useState2 = React.useState({}),
      layout = _React$useState2[0],
      updateLayout = _React$useState2[1];

  var hasTextAncestor = React.useContext(TextAncestorContext);
  var hiddenImageRef = React.useRef(null);
  var filterRef = React.useRef(_filterId++);
  var requestRef = React.useRef(null);
  var uri = resolveAssetUri(source);
  var isCached = uri != null && ImageLoader.has(uri);
  var shouldDisplaySource = state === LOADED || isCached || state === LOADING && defaultSource == null;

  var _getFlatStyle = getFlatStyle(style, blurRadius, filterRef.current),
      flatStyle = _getFlatStyle[0],
      _resizeMode = _getFlatStyle[1],
      filter = _getFlatStyle[2],
      tintColor = _getFlatStyle[3];

  var resizeMode = props.resizeMode || _resizeMode || 'cover';
  var selectedSource = shouldDisplaySource ? source : defaultSource;
  var displayImageUri = resolveAssetUri(selectedSource);
  var imageSizeStyle = resolveAssetDimensions(selectedSource);
  var backgroundImage = displayImageUri ? "url(\"" + displayImageUri + "\")" : null;
  var backgroundSize = getBackgroundSize(); // Accessibility image allows users to trigger the browser's image context menu

  var hiddenImage = displayImageUri ? createElement('img', {
    alt: accessibilityLabel || '',
    style: styles.accessibilityImage$raw,
    draggable: draggable || false,
    ref: hiddenImageRef,
    src: displayImageUri
  }) : null;

  function getBackgroundSize() {
    if (hiddenImageRef.current != null && (resizeMode === 'center' || resizeMode === 'repeat')) {
      var _hiddenImageRef$curre = hiddenImageRef.current,
          naturalHeight = _hiddenImageRef$curre.naturalHeight,
          naturalWidth = _hiddenImageRef$curre.naturalWidth;
      var _height3 = layout.height,
          _width3 = layout.width;

      if (naturalHeight && naturalWidth && _height3 && _width3) {
        var scaleFactor = Math.min(1, _width3 / naturalWidth, _height3 / naturalHeight);
        var x = Math.ceil(scaleFactor * naturalWidth);
        var y = Math.ceil(scaleFactor * naturalHeight);
        return x + "px " + y + "px";
      }
    }
  }

  function handleLayout(e) {
    if (resizeMode === 'center' || resizeMode === 'repeat' || onLayout) {
      var _layout = e.nativeEvent.layout;
      onLayout && onLayout(e);
      updateLayout(_layout);
    }
  } // Image loading


  React.useEffect(() => {
    abortPendingRequest();

    if (uri != null) {
      updateState(LOADING);

      if (onLoadStart) {
        onLoadStart();
      }

      requestRef.current = ImageLoader.load(uri, function load(e) {
        updateState(LOADED);

        if (onLoad) {
          onLoad(e);
        }

        if (onLoadEnd) {
          onLoadEnd();
        }
      }, function error() {
        updateState(ERRORED);
        raiseOnErrorEvent(uri, {
          onError,
          onLoadEnd
        });
      });
    }

    function abortPendingRequest() {
      if (requestRef.current != null) {
        ImageLoader.clear(requestRef.current);
        requestRef.current = null;
      }
    }

    return abortPendingRequest;
  }, [uri, requestRef, updateState, onError, onLoad, onLoadEnd, onLoadStart]);
  return /*#__PURE__*/React.createElement(View, _extends({}, rest, {
    accessibilityLabel: accessibilityLabel,
    onLayout: handleLayout,
    pointerEvents: pointerEvents,
    ref: ref,
    style: [styles.root, hasTextAncestor && styles.inline, imageSizeStyle, flatStyle]
  }), /*#__PURE__*/React.createElement(View, {
    style: [styles.image, resizeModeStyles[resizeMode], {
      backgroundImage,
      filter
    }, backgroundSize != null && {
      backgroundSize
    }],
    suppressHydrationWarning: true
  }), hiddenImage, createTintColorSVG(tintColor, filterRef.current));
});
BaseImage.displayName = 'Image';
/**
 * This component handles specifically loading an image source with headers
 * default source is never loaded using headers
 */

var ImageWithHeaders = /*#__PURE__*/React.forwardRef((props, ref) => {
  // $FlowIgnore: This component would only be rendered when `source` matches `ImageSource`
  var nextSource = props.source;

  var _React$useState3 = React.useState(''),
      blobUri = _React$useState3[0],
      setBlobUri = _React$useState3[1];

  var request = React.useRef({
    cancel: () => {},
    source: {
      uri: '',
      headers: {}
    },
    promise: Promise.resolve('')
  });
  var onError = props.onError,
      onLoadStart = props.onLoadStart,
      onLoadEnd = props.onLoadEnd;
  React.useEffect(() => {
    if (!hasSourceDiff(nextSource, request.current.source)) {
      return;
    } // When source changes we want to clean up any old/running requests


    request.current.cancel();

    if (onLoadStart) {
      onLoadStart();
    } // Store a ref for the current load request so we know what's the last loaded source,
    // and so we can cancel it if a different source is passed through props


    request.current = ImageLoader.loadWithHeaders(nextSource);
    request.current.promise.then(uri => setBlobUri(uri)).catch(() => raiseOnErrorEvent(request.current.source.uri, {
      onError,
      onLoadEnd
    }));
  }, [nextSource, onLoadStart, onError, onLoadEnd]); // Cancel any request on unmount

  React.useEffect(() => request.current.cancel, []);

  var propsToPass = _objectSpread(_objectSpread({}, props), {}, {
    // `onLoadStart` is called from the current component
    // We skip passing it down to prevent BaseImage raising it a 2nd time
    onLoadStart: undefined,
    // Until the current component resolves the request (using headers)
    // we skip forwarding the source so the base component doesn't attempt
    // to load the original source
    source: blobUri ? _objectSpread(_objectSpread({}, nextSource), {}, {
      uri: blobUri
    }) : undefined
  });

  return /*#__PURE__*/React.createElement(BaseImage, _extends({
    ref: ref
  }, propsToPass));
}); // $FlowIgnore: This is the correct type, but casting makes it unhappy since the variables aren't defined yet

var ImageWithStatics = /*#__PURE__*/React.forwardRef((props, ref) => {
  if (props.source && props.source.headers) {
    return /*#__PURE__*/React.createElement(ImageWithHeaders, _extends({
      ref: ref
    }, props));
  }

  return /*#__PURE__*/React.createElement(BaseImage, _extends({
    ref: ref
  }, props));
});

ImageWithStatics.getSize = function (uri, success, failure) {
  ImageLoader.getSize(uri, success, failure);
};

ImageWithStatics.prefetch = function (uri) {
  return ImageLoader.prefetch(uri);
};

ImageWithStatics.queryCache = function (uris) {
  return ImageLoader.queryCache(uris);
};

var styles = StyleSheet.create({
  root: {
    flexBasis: 'auto',
    overflow: 'hidden',
    zIndex: 0
  },
  inline: {
    display: 'inline-flex'
  },
  image: _objectSpread(_objectSpread({}, StyleSheet.absoluteFillObject), {}, {
    backgroundColor: 'transparent',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    height: '100%',
    width: '100%',
    zIndex: -1
  }),
  accessibilityImage$raw: _objectSpread(_objectSpread({}, StyleSheet.absoluteFillObject), {}, {
    height: '100%',
    opacity: 0,
    width: '100%',
    zIndex: -1
  })
});
var resizeModeStyles = StyleSheet.create({
  center: {
    backgroundSize: 'auto'
  },
  contain: {
    backgroundSize: 'contain'
  },
  cover: {
    backgroundSize: 'cover'
  },
  none: {
    backgroundPosition: '0',
    backgroundSize: 'auto'
  },
  repeat: {
    backgroundPosition: '0',
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto'
  },
  stretch: {
    backgroundSize: '100% 100%'
  }
});
export default ImageWithStatics;