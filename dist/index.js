// src/constants/api.ts
var API_ACTIONS = {
  GET_REPOS: "edd_release_deploy_get_repos",
  GET_RELEASES: "edd_release_deploy_get_releases",
  TEST_FILE: "edd_release_deploy_test_file",
  TEST_CONNECTION: "edd_release_deploy_test_connection",
  CLEAR_CACHE: "edd_release_deploy_clear_cache",
  GET_RATE_LIMIT: "edd_release_deploy_get_rate_limit"
};

// src/constants/ui.ts
var INTERVALS = {
  POLL: 600,
  DEBOUNCE: 600
};
var SIZE_UNITS = ["B", "KB", "MB", "GB"];
var GITHUB_PROTOCOL = "edd-release-deploy://";

// src/constants/dom.ts
var EDD_SELECTORS = {
  /** EDD file upload input field */
  UPLOAD_FIELD: ".edd_repeatable_upload_field",
  /** Wrapper around EDD file upload field */
  UPLOAD_WRAPPER: ".edd_repeatable_upload_wrapper",
  /** EDD file name input field */
  NAME_FIELD: ".edd_repeatable_name_field",
  /** Container for EDD file upload field */
  UPLOAD_FIELD_CONTAINER: ".edd_repeatable_upload_field_container",
  /** EDD repeatable row standard fields container */
  REPEATABLE_ROW: ".edd-repeatable-row-standard-fields",
  /** EDD Software Licensing version field */
  VERSION_FIELD: "#edd_sl_version",
  /** EDD Software Licensing changelog field (TinyMCE editor ID) */
  CHANGELOG_FIELD: "#edd_sl_changelog",
  /** Label for changelog field */
  CHANGELOG_LABEL: 'label[for="edd_sl_changelog"]'
};

// src/constants/TRANSLATION_FALLBACKS.ts
var TRANSLATION_FALLBACKS = {
  // Common strings
  "common.getPro": "Get Pro",
  "common.fixIt": "Fix It",
  // Token field strings
  "token.checking": "Checking connection...",
  "token.connected": "Connected",
  "token.invalid": "Invalid GitHub token",
  "token.apiCalls": "API calls remaining",
  "token.managedViaConstant": "Managed via PHP constant",
  "token.constantHelp": "Token is defined via EDD_RELEASE_DEPLOY_TOKEN constant (typically in wp-config.php)",
  "token.enterHelp": "Enter your GitHub PAT with repo scope. You can also define EDD_RELEASE_DEPLOY_TOKEN constant in wp-config.php",
  "token.hide": "Hide token",
  "token.show": "Show token",
  "token.refresh": "Click to refresh",
  "token.howToCreate": "How to Create a GitHub Token",
  "token.instruction1": "Go to GitHub.com \u2192 Settings \u2192 Developer settings \u2192 Personal access tokens \u2192 Tokens (classic)",
  "token.instruction2": 'Click "Generate new token (classic)"',
  "token.instruction3": 'Give your token a descriptive name (e.g., "WordPress EDD")',
  "token.instruction4": 'Select the "repo" scope (full control of private repositories)',
  "token.instruction5": 'Click "Generate token" and copy the token immediately',
  "token.instruction6": "Paste the token in the field above and it will be validated automatically",
  // File status strings
  "file.testing": "Testing...",
  "file.ready": "Ready",
  "file.networkError": "Network error",
  "file.retest": "Click to re-test",
  "file.retry": "Click to retry",
  // Sync strings
  "sync.autoVersionSync": "Auto Version Sync",
  "sync.autoChangelogSync": "Auto Changelog Sync"
};

// src/utils/format.ts
function formatSize(bytes) {
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${SIZE_UNITS[unitIndex]}`;
}

// src/utils/github.ts
function parseGitHubUrl(url) {
  if (!url || !url.startsWith(GITHUB_PROTOCOL)) {
    return null;
  }
  const clean = url.replace(GITHUB_PROTOCOL, "");
  const parts = clean.split("/");
  if (parts.length >= 4 && parts[0] && parts[1] && parts[2] && parts[3]) {
    return {
      owner: parts[0],
      repo: parts[1],
      release: parts[2],
      filename: parts[3]
    };
  }
  return null;
}
function buildGitHubUrl(repo, release, filename) {
  return `${GITHUB_PROTOCOL}${repo}/${release}/${filename}`;
}

// src/utils/errorHandler.ts
function handleError(error, context, options = {}) {
  const { notify = false, details = null, critical = false } = options;
  const errorMessage = getErrorMessage(error);
  const consoleMessage = `[EDD Release Deploy - ${context}] ${errorMessage}`;
  if (critical) {
    console.error(consoleMessage, details || "");
  }
  if (notify) {
    console.warn(`[${context}] ${errorMessage}`);
  }
  return {
    message: errorMessage,
    context,
    details
  };
}
function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unknown error occurred";
}
function getContextLabel(context) {
  const labels = {
    "version-sync": "Version Sync",
    "changelog-sync": "Changelog Sync",
    webhook: "Webhook",
    browser: "File Browser",
    "file-status": "File Status",
    settings: "Settings",
    general: "Release Deploy"
  };
  return labels[context] || "Error";
}

// src/utils/getString.ts
var getString = (key) => {
  if (window.releaseDeployEDD?.strings?.[key]) {
    return window.releaseDeployEDD.strings[key];
  }
  return TRANSLATION_FALLBACKS[key] || key;
};

// src/hooks/usePolling.ts
import { useEffect, useRef } from "react";
function usePolling(callback, interval, enabled = true) {
  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, interval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, enabled]);
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  const trigger = () => {
    callbackRef.current();
  };
  return {
    stopPolling,
    trigger
  };
}
function useTimeouts() {
  const timeoutsRef = useRef(/* @__PURE__ */ new Set());
  const setTrackedTimeout = (callback, delay) => {
    const timeoutId = setTimeout(() => {
      callback();
      timeoutsRef.current.delete(timeoutId);
    }, delay);
    timeoutsRef.current.add(timeoutId);
    return timeoutId;
  };
  const clearTrackedTimeout = (timeoutId) => {
    clearTimeout(timeoutId);
    timeoutsRef.current.delete(timeoutId);
  };
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.clear();
  };
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);
  return {
    setTrackedTimeout,
    clearTrackedTimeout,
    clearAllTimeouts
  };
}

// src/hooks/useGitHubFiles.ts
import { useState, useEffect as useEffect2, useRef as useRef2 } from "react";
function useGitHubFiles() {
  const [hasGitHubFiles, setHasGitHubFiles] = useState(false);
  const linkedGitHubFileRef = useRef2(null);
  const isMountedRef = useRef2(true);
  const getFirstGitHubFile = () => {
    const fileInputs = document.querySelectorAll(EDD_SELECTORS.UPLOAD_FIELD);
    for (let i = 0; i < fileInputs.length; i++) {
      const input = fileInputs[i];
      if (input.value && input.value.startsWith(GITHUB_PROTOCOL)) {
        return input.value;
      }
    }
    return null;
  };
  const checkForGitHubFiles = () => {
    const fileInputs = document.querySelectorAll(EDD_SELECTORS.UPLOAD_FIELD);
    let foundGitHub = false;
    const currentGitHubFile = getFirstGitHubFile();
    for (let i = 0; i < fileInputs.length; i++) {
      const input = fileInputs[i];
      if (input.value && input.value.startsWith(GITHUB_PROTOCOL)) {
        foundGitHub = true;
        break;
      }
    }
    if (isMountedRef.current) {
      setHasGitHubFiles(foundGitHub);
      if (linkedGitHubFileRef.current && currentGitHubFile !== linkedGitHubFileRef.current) {
        linkedGitHubFileRef.current = null;
        return true;
      }
    }
    return false;
  };
  const startPolling = (onFileChange) => {
    const pollInterval = window.setInterval(() => {
      const currentInputs = document.querySelectorAll(EDD_SELECTORS.UPLOAD_FIELD);
      currentInputs.forEach((input) => {
        const currentValue = input.value;
        const previousValue = input.getAttribute("data-prev-value");
        if (currentValue !== previousValue) {
          input.setAttribute("data-prev-value", currentValue);
          if (checkForGitHubFiles() && onFileChange) {
            onFileChange();
          }
        }
      });
    }, INTERVALS.POLL);
    return pollInterval;
  };
  useEffect2(() => {
    isMountedRef.current = true;
    checkForGitHubFiles();
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  return {
    hasGitHubFiles,
    linkedGitHubFileRef,
    getFirstGitHubFile,
    checkForGitHubFiles,
    startPolling
  };
}

// src/hooks/useTokenValidation.ts
import { useState as useState2, useEffect as useEffect3 } from "react";

// src/services/GitHubService.ts
var GitHubServiceClass = class {
  constructor(fetcher = fetch.bind(globalThis), actions = API_ACTIONS) {
    this.fetcher = fetcher;
    this.actions = actions;
  }
  /** Create FormData for WordPress AJAX request */
  createFormData(action, nonce, data) {
    const formData = new FormData();
    formData.append("action", action);
    formData.append("nonce", nonce);
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    return formData;
  }
  /** Test if a GitHub file exists and get its info */
  async testFile(ajaxUrl, nonce, fileUrl, signal) {
    const formData = this.createFormData(this.actions.TEST_FILE, nonce, {
      file_url: fileUrl
    });
    const fetchOptions = {
      method: "POST",
      body: formData
    };
    if (signal) {
      fetchOptions.signal = signal;
    }
    const response = await this.fetcher(ajaxUrl, fetchOptions);
    const data = await response.json();
    if (!data.success) {
      const error = new Error(data.data?.message || "Test failed");
      if (data.data?.code) {
        error.code = data.data.code;
      }
      throw error;
    }
    return data.data;
  }
  /** Test GitHub token connection */
  async testConnection(ajaxUrl, nonce, token) {
    const formData = this.createFormData(this.actions.TEST_CONNECTION, nonce, {
      token
    });
    const response = await this.fetcher(ajaxUrl, {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    return data.success;
  }
  /** Get GitHub API rate limit */
  async getRateLimit(ajaxUrl, nonce) {
    const formData = this.createFormData(this.actions.GET_RATE_LIMIT, nonce);
    try {
      const response = await this.fetcher(ajaxUrl, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (!data.success) {
        return null;
      }
      return data.data?.rate_limit || null;
    } catch (error) {
      return null;
    }
  }
};
var defaultInstance = new GitHubServiceClass();
var GitHubService = {
  testFile: defaultInstance.testFile.bind(defaultInstance),
  testConnection: defaultInstance.testConnection.bind(defaultInstance),
  getRateLimit: defaultInstance.getRateLimit.bind(defaultInstance)
};
var createGitHubService = (fetcher) => new GitHubServiceClass(fetcher);

// src/hooks/useTokenValidation.ts
function useTokenValidation({
  initialToken,
  ajaxUrl,
  nonce,
  isConstantDefined,
  gitHubService = GitHubService
}) {
  const [status, setStatus] = useState2("idle");
  const [rateLimit, setRateLimit] = useState2(null);
  const [isLoadingRateLimit, setIsLoadingRateLimit] = useState2(false);
  const validateToken = async (token) => {
    if (!token && !isConstantDefined) {
      setStatus("idle");
      setRateLimit(null);
      return;
    }
    setStatus("checking");
    try {
      const isValid = await gitHubService.testConnection(ajaxUrl, nonce, token || "");
      setStatus(isValid ? "valid" : "invalid");
      if (isValid) {
        const limit = await gitHubService.getRateLimit(ajaxUrl, nonce);
        setRateLimit(limit);
      } else {
        setRateLimit(null);
      }
    } catch (error) {
      setStatus("invalid");
      setRateLimit(null);
    }
  };
  const refreshStatus = async (token) => {
    if (status === "checking" || isLoadingRateLimit) {
      return;
    }
    if (!token && !isConstantDefined) {
      return;
    }
    setIsLoadingRateLimit(true);
    try {
      await validateToken(token);
    } catch (error) {
    } finally {
      setIsLoadingRateLimit(false);
    }
  };
  useEffect3(() => {
    if (initialToken || isConstantDefined) {
      validateToken(initialToken);
    }
  }, []);
  return {
    status,
    rateLimit,
    isLoadingRateLimit,
    validateToken,
    refreshStatus
  };
}

// src/hooks/useFileValidation.ts
import { useState as useState3, useEffect as useEffect4, useRef as useRef3 } from "react";

// node_modules/.pnpm/dompurify@3.3.0/node_modules/dompurify/dist/purify.es.mjs
var {
  entries,
  setPrototypeOf,
  isFrozen,
  getPrototypeOf,
  getOwnPropertyDescriptor
} = Object;
var {
  freeze,
  seal,
  create
} = Object;
var {
  apply,
  construct
} = typeof Reflect !== "undefined" && Reflect;
if (!freeze) {
  freeze = function freeze2(x) {
    return x;
  };
}
if (!seal) {
  seal = function seal2(x) {
    return x;
  };
}
if (!apply) {
  apply = function apply2(func, thisArg) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    return func.apply(thisArg, args);
  };
}
if (!construct) {
  construct = function construct2(Func) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    return new Func(...args);
  };
}
var arrayForEach = unapply(Array.prototype.forEach);
var arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
var arrayPop = unapply(Array.prototype.pop);
var arrayPush = unapply(Array.prototype.push);
var arraySplice = unapply(Array.prototype.splice);
var stringToLowerCase = unapply(String.prototype.toLowerCase);
var stringToString = unapply(String.prototype.toString);
var stringMatch = unapply(String.prototype.match);
var stringReplace = unapply(String.prototype.replace);
var stringIndexOf = unapply(String.prototype.indexOf);
var stringTrim = unapply(String.prototype.trim);
var objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
var regExpTest = unapply(RegExp.prototype.test);
var typeErrorCreate = unconstruct(TypeError);
function unapply(func) {
  return function(thisArg) {
    if (thisArg instanceof RegExp) {
      thisArg.lastIndex = 0;
    }
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    return apply(func, thisArg, args);
  };
}
function unconstruct(Func) {
  return function() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return construct(Func, args);
  };
}
function addToSet(set, array) {
  let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
  if (setPrototypeOf) {
    setPrototypeOf(set, null);
  }
  let l = array.length;
  while (l--) {
    let element = array[l];
    if (typeof element === "string") {
      const lcElement = transformCaseFunc(element);
      if (lcElement !== element) {
        if (!isFrozen(array)) {
          array[l] = lcElement;
        }
        element = lcElement;
      }
    }
    set[element] = true;
  }
  return set;
}
function cleanArray(array) {
  for (let index = 0; index < array.length; index++) {
    const isPropertyExist = objectHasOwnProperty(array, index);
    if (!isPropertyExist) {
      array[index] = null;
    }
  }
  return array;
}
function clone(object) {
  const newObject = create(null);
  for (const [property, value] of entries(object)) {
    const isPropertyExist = objectHasOwnProperty(object, property);
    if (isPropertyExist) {
      if (Array.isArray(value)) {
        newObject[property] = cleanArray(value);
      } else if (value && typeof value === "object" && value.constructor === Object) {
        newObject[property] = clone(value);
      } else {
        newObject[property] = value;
      }
    }
  }
  return newObject;
}
function lookupGetter(object, prop) {
  while (object !== null) {
    const desc = getOwnPropertyDescriptor(object, prop);
    if (desc) {
      if (desc.get) {
        return unapply(desc.get);
      }
      if (typeof desc.value === "function") {
        return unapply(desc.value);
      }
    }
    object = getPrototypeOf(object);
  }
  function fallbackValue() {
    return null;
  }
  return fallbackValue;
}
var html$1 = freeze(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]);
var svg$1 = freeze(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]);
var svgFilters = freeze(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]);
var svgDisallowed = freeze(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]);
var mathMl$1 = freeze(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]);
var mathMlDisallowed = freeze(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]);
var text = freeze(["#text"]);
var html = freeze(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns", "slot"]);
var svg = freeze(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]);
var mathMl = freeze(["accent", "accentunder", "align", "bevelled", "close", "columnsalign", "columnlines", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lspace", "lquote", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]);
var xml = freeze(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]);
var MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm);
var ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
var TMPLIT_EXPR = seal(/\$\{[\w\W]*/gm);
var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
var ARIA_ATTR = seal(/^aria-[\-\w]+$/);
var IS_ALLOWED_URI = seal(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
);
var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
var ATTR_WHITESPACE = seal(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
);
var DOCTYPE_NAME = seal(/^html$/i);
var CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
var EXPRESSIONS = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ARIA_ATTR,
  ATTR_WHITESPACE,
  CUSTOM_ELEMENT,
  DATA_ATTR,
  DOCTYPE_NAME,
  ERB_EXPR,
  IS_ALLOWED_URI,
  IS_SCRIPT_OR_DATA,
  MUSTACHE_EXPR,
  TMPLIT_EXPR
});
var NODE_TYPE = {
  element: 1,
  attribute: 2,
  text: 3,
  cdataSection: 4,
  entityReference: 5,
  // Deprecated
  entityNode: 6,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9,
  documentType: 10,
  documentFragment: 11,
  notation: 12
  // Deprecated
};
var getGlobal = function getGlobal2() {
  return typeof window === "undefined" ? null : window;
};
var _createTrustedTypesPolicy = function _createTrustedTypesPolicy2(trustedTypes, purifyHostElement) {
  if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") {
    return null;
  }
  let suffix = null;
  const ATTR_NAME = "data-tt-policy-suffix";
  if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
    suffix = purifyHostElement.getAttribute(ATTR_NAME);
  }
  const policyName = "dompurify" + (suffix ? "#" + suffix : "");
  try {
    return trustedTypes.createPolicy(policyName, {
      createHTML(html2) {
        return html2;
      },
      createScriptURL(scriptUrl) {
        return scriptUrl;
      }
    });
  } catch (_) {
    console.warn("TrustedTypes policy " + policyName + " could not be created.");
    return null;
  }
};
var _createHooksMap = function _createHooksMap2() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
};
function createDOMPurify() {
  let window2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
  const DOMPurify = (root) => createDOMPurify(root);
  DOMPurify.version = "3.3.0";
  DOMPurify.removed = [];
  if (!window2 || !window2.document || window2.document.nodeType !== NODE_TYPE.document || !window2.Element) {
    DOMPurify.isSupported = false;
    return DOMPurify;
  }
  let {
    document: document2
  } = window2;
  const originalDocument = document2;
  const currentScript = originalDocument.currentScript;
  const {
    DocumentFragment,
    HTMLTemplateElement,
    Node: Node2,
    Element,
    NodeFilter,
    NamedNodeMap = window2.NamedNodeMap || window2.MozNamedAttrMap,
    HTMLFormElement,
    DOMParser,
    trustedTypes
  } = window2;
  const ElementPrototype = Element.prototype;
  const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
  const remove = lookupGetter(ElementPrototype, "remove");
  const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
  const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
  const getParentNode = lookupGetter(ElementPrototype, "parentNode");
  if (typeof HTMLTemplateElement === "function") {
    const template = document2.createElement("template");
    if (template.content && template.content.ownerDocument) {
      document2 = template.content.ownerDocument;
    }
  }
  let trustedTypesPolicy;
  let emptyHTML = "";
  const {
    implementation,
    createNodeIterator,
    createDocumentFragment,
    getElementsByTagName
  } = document2;
  const {
    importNode
  } = originalDocument;
  let hooks = _createHooksMap();
  DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
  const {
    MUSTACHE_EXPR: MUSTACHE_EXPR2,
    ERB_EXPR: ERB_EXPR2,
    TMPLIT_EXPR: TMPLIT_EXPR2,
    DATA_ATTR: DATA_ATTR2,
    ARIA_ATTR: ARIA_ATTR2,
    IS_SCRIPT_OR_DATA: IS_SCRIPT_OR_DATA2,
    ATTR_WHITESPACE: ATTR_WHITESPACE2,
    CUSTOM_ELEMENT: CUSTOM_ELEMENT2
  } = EXPRESSIONS;
  let {
    IS_ALLOWED_URI: IS_ALLOWED_URI$1
  } = EXPRESSIONS;
  let ALLOWED_TAGS = null;
  const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
  let ALLOWED_ATTR = null;
  const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
  let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
    tagNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: false
    }
  }));
  let FORBID_TAGS = null;
  let FORBID_ATTR = null;
  const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
    tagCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    }
  }));
  let ALLOW_ARIA_ATTR = true;
  let ALLOW_DATA_ATTR = true;
  let ALLOW_UNKNOWN_PROTOCOLS = false;
  let ALLOW_SELF_CLOSE_IN_ATTR = true;
  let SAFE_FOR_TEMPLATES = false;
  let SAFE_FOR_XML = true;
  let WHOLE_DOCUMENT = false;
  let SET_CONFIG = false;
  let FORCE_BODY = false;
  let RETURN_DOM = false;
  let RETURN_DOM_FRAGMENT = false;
  let RETURN_TRUSTED_TYPE = false;
  let SANITIZE_DOM = true;
  let SANITIZE_NAMED_PROPS = false;
  const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
  let KEEP_CONTENT = true;
  let IN_PLACE = false;
  let USE_PROFILES = {};
  let FORBID_CONTENTS = null;
  const DEFAULT_FORBID_CONTENTS = addToSet({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let DATA_URI_TAGS = null;
  const DEFAULT_DATA_URI_TAGS = addToSet({}, ["audio", "video", "img", "source", "image", "track"]);
  let URI_SAFE_ATTRIBUTES = null;
  const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]);
  const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  let NAMESPACE = HTML_NAMESPACE;
  let IS_EMPTY_INPUT = false;
  let ALLOWED_NAMESPACES = null;
  const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
  let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ["mi", "mo", "mn", "ms", "mtext"]);
  let HTML_INTEGRATION_POINTS = addToSet({}, ["annotation-xml"]);
  const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ["title", "style", "font", "a", "script"]);
  let PARSER_MEDIA_TYPE = null;
  const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
  const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
  let transformCaseFunc = null;
  let CONFIG = null;
  const formElement = document2.createElement("form");
  const isRegexOrFunction = function isRegexOrFunction2(testValue) {
    return testValue instanceof RegExp || testValue instanceof Function;
  };
  const _parseConfig = function _parseConfig2() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (CONFIG && CONFIG === cfg) {
      return;
    }
    if (!cfg || typeof cfg !== "object") {
      cfg = {};
    }
    cfg = clone(cfg);
    PARSER_MEDIA_TYPE = // eslint-disable-next-line unicorn/prefer-includes
    SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
    transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
    ALLOWED_TAGS = objectHasOwnProperty(cfg, "ALLOWED_TAGS") ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
    ALLOWED_ATTR = objectHasOwnProperty(cfg, "ALLOWED_ATTR") ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
    ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, "ALLOWED_NAMESPACES") ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
    URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc) : DEFAULT_URI_SAFE_ATTRIBUTES;
    DATA_URI_TAGS = objectHasOwnProperty(cfg, "ADD_DATA_URI_TAGS") ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc) : DEFAULT_DATA_URI_TAGS;
    FORBID_CONTENTS = objectHasOwnProperty(cfg, "FORBID_CONTENTS") ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
    FORBID_TAGS = objectHasOwnProperty(cfg, "FORBID_TAGS") ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : clone({});
    FORBID_ATTR = objectHasOwnProperty(cfg, "FORBID_ATTR") ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : clone({});
    USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES : false;
    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
    ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
    SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
    RETURN_DOM = cfg.RETURN_DOM || false;
    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
    FORCE_BODY = cfg.FORCE_BODY || false;
    SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
    SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
    KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
    IN_PLACE = cfg.IN_PLACE || false;
    IS_ALLOWED_URI$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI;
    NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
    MATHML_TEXT_INTEGRATION_POINTS = cfg.MATHML_TEXT_INTEGRATION_POINTS || MATHML_TEXT_INTEGRATION_POINTS;
    HTML_INTEGRATION_POINTS = cfg.HTML_INTEGRATION_POINTS || HTML_INTEGRATION_POINTS;
    CUSTOM_ELEMENT_HANDLING = cfg.CUSTOM_ELEMENT_HANDLING || {};
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.tagNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.attributeNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements === "boolean") {
      CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements;
    }
    if (SAFE_FOR_TEMPLATES) {
      ALLOW_DATA_ATTR = false;
    }
    if (RETURN_DOM_FRAGMENT) {
      RETURN_DOM = true;
    }
    if (USE_PROFILES) {
      ALLOWED_TAGS = addToSet({}, text);
      ALLOWED_ATTR = [];
      if (USE_PROFILES.html === true) {
        addToSet(ALLOWED_TAGS, html$1);
        addToSet(ALLOWED_ATTR, html);
      }
      if (USE_PROFILES.svg === true) {
        addToSet(ALLOWED_TAGS, svg$1);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.svgFilters === true) {
        addToSet(ALLOWED_TAGS, svgFilters);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.mathMl === true) {
        addToSet(ALLOWED_TAGS, mathMl$1);
        addToSet(ALLOWED_ATTR, mathMl);
        addToSet(ALLOWED_ATTR, xml);
      }
    }
    if (cfg.ADD_TAGS) {
      if (typeof cfg.ADD_TAGS === "function") {
        EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
      } else {
        if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
          ALLOWED_TAGS = clone(ALLOWED_TAGS);
        }
        addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
      }
    }
    if (cfg.ADD_ATTR) {
      if (typeof cfg.ADD_ATTR === "function") {
        EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
      } else {
        if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
          ALLOWED_ATTR = clone(ALLOWED_ATTR);
        }
        addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
      }
    }
    if (cfg.ADD_URI_SAFE_ATTR) {
      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
    }
    if (cfg.FORBID_CONTENTS) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
    }
    if (KEEP_CONTENT) {
      ALLOWED_TAGS["#text"] = true;
    }
    if (WHOLE_DOCUMENT) {
      addToSet(ALLOWED_TAGS, ["html", "head", "body"]);
    }
    if (ALLOWED_TAGS.table) {
      addToSet(ALLOWED_TAGS, ["tbody"]);
      delete FORBID_TAGS.tbody;
    }
    if (cfg.TRUSTED_TYPES_POLICY) {
      if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      }
      if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      }
      trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
      emptyHTML = trustedTypesPolicy.createHTML("");
    } else {
      if (trustedTypesPolicy === void 0) {
        trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
      }
      if (trustedTypesPolicy !== null && typeof emptyHTML === "string") {
        emptyHTML = trustedTypesPolicy.createHTML("");
      }
    }
    if (freeze) {
      freeze(cfg);
    }
    CONFIG = cfg;
  };
  const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
  const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
  const _checkValidNamespace = function _checkValidNamespace2(element) {
    let parent = getParentNode(element);
    if (!parent || !parent.tagName) {
      parent = {
        namespaceURI: NAMESPACE,
        tagName: "template"
      };
    }
    const tagName = stringToLowerCase(element.tagName);
    const parentTagName = stringToLowerCase(parent.tagName);
    if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
      return false;
    }
    if (element.namespaceURI === SVG_NAMESPACE) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "svg";
      }
      if (parent.namespaceURI === MATHML_NAMESPACE) {
        return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
      }
      return Boolean(ALL_SVG_TAGS[tagName]);
    }
    if (element.namespaceURI === MATHML_NAMESPACE) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "math";
      }
      if (parent.namespaceURI === SVG_NAMESPACE) {
        return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
      }
      return Boolean(ALL_MATHML_TAGS[tagName]);
    }
    if (element.namespaceURI === HTML_NAMESPACE) {
      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) {
      return true;
    }
    return false;
  };
  const _forceRemove = function _forceRemove2(node) {
    arrayPush(DOMPurify.removed, {
      element: node
    });
    try {
      getParentNode(node).removeChild(node);
    } catch (_) {
      remove(node);
    }
  };
  const _removeAttribute = function _removeAttribute2(name, element) {
    try {
      arrayPush(DOMPurify.removed, {
        attribute: element.getAttributeNode(name),
        from: element
      });
    } catch (_) {
      arrayPush(DOMPurify.removed, {
        attribute: null,
        from: element
      });
    }
    element.removeAttribute(name);
    if (name === "is") {
      if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
        try {
          _forceRemove(element);
        } catch (_) {
        }
      } else {
        try {
          element.setAttribute(name, "");
        } catch (_) {
        }
      }
    }
  };
  const _initDocument = function _initDocument2(dirty) {
    let doc = null;
    let leadingWhitespace = null;
    if (FORCE_BODY) {
      dirty = "<remove></remove>" + dirty;
    } else {
      const matches = stringMatch(dirty, /^[\r\n\t ]+/);
      leadingWhitespace = matches && matches[0];
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) {
      dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + "</body></html>";
    }
    const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
    if (NAMESPACE === HTML_NAMESPACE) {
      try {
        doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
      } catch (_) {
      }
    }
    if (!doc || !doc.documentElement) {
      doc = implementation.createDocument(NAMESPACE, "template", null);
      try {
        doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
      } catch (_) {
      }
    }
    const body = doc.body || doc.documentElement;
    if (dirty && leadingWhitespace) {
      body.insertBefore(document2.createTextNode(leadingWhitespace), body.childNodes[0] || null);
    }
    if (NAMESPACE === HTML_NAMESPACE) {
      return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
    }
    return WHOLE_DOCUMENT ? doc.documentElement : body;
  };
  const _createNodeIterator = function _createNodeIterator2(root) {
    return createNodeIterator.call(
      root.ownerDocument || root,
      root,
      // eslint-disable-next-line no-bitwise
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION,
      null
    );
  };
  const _isClobbered = function _isClobbered2(element) {
    return element instanceof HTMLFormElement && (typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || !(element.attributes instanceof NamedNodeMap) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function");
  };
  const _isNode = function _isNode2(value) {
    return typeof Node2 === "function" && value instanceof Node2;
  };
  function _executeHooks(hooks2, currentNode, data) {
    arrayForEach(hooks2, (hook) => {
      hook.call(DOMPurify, currentNode, data, CONFIG);
    });
  }
  const _sanitizeElements = function _sanitizeElements2(currentNode) {
    let content = null;
    _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
    if (_isClobbered(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    const tagName = transformCaseFunc(currentNode.nodeName);
    _executeHooks(hooks.uponSanitizeElement, currentNode, {
      tagName,
      allowedTags: ALLOWED_TAGS
    });
    if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(/<[/\w!]/g, currentNode.innerHTML) && regExpTest(/<[/\w!]/g, currentNode.textContent)) {
      _forceRemove(currentNode);
      return true;
    }
    if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
      _forceRemove(currentNode);
      return true;
    }
    if (!(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName])) {
      if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
          return false;
        }
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
          return false;
        }
      }
      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
        const parentNode = getParentNode(currentNode) || currentNode.parentNode;
        const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
        if (childNodes && parentNode) {
          const childCount = childNodes.length;
          for (let i = childCount - 1; i >= 0; --i) {
            const childClone = cloneNode(childNodes[i], true);
            childClone.__removalCount = (currentNode.__removalCount || 0) + 1;
            parentNode.insertBefore(childClone, getNextSibling(currentNode));
          }
        }
      }
      _forceRemove(currentNode);
      return true;
    }
    if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
      content = currentNode.textContent;
      arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
        content = stringReplace(content, expr, " ");
      });
      if (currentNode.textContent !== content) {
        arrayPush(DOMPurify.removed, {
          element: currentNode.cloneNode()
        });
        currentNode.textContent = content;
      }
    }
    _executeHooks(hooks.afterSanitizeElements, currentNode, null);
    return false;
  };
  const _isValidAttribute = function _isValidAttribute2(lcTag, lcName, value) {
    if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document2 || value in formElement)) {
      return false;
    }
    if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR2, lcName)) ;
    else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR2, lcName)) ;
    else if (EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag)) ;
    else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
      if (
        // First condition does a very basic check if a) it's basically a valid custom element tagname AND
        // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
        _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) || // Alternative, second condition checks if it's an `is`-attribute, AND
        // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))
      ) ;
      else {
        return false;
      }
    } else if (URI_SAFE_ATTRIBUTES[lcName]) ;
    else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE2, ""))) ;
    else if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) ;
    else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA2, stringReplace(value, ATTR_WHITESPACE2, ""))) ;
    else if (value) {
      return false;
    } else ;
    return true;
  };
  const _isBasicCustomElement = function _isBasicCustomElement2(tagName) {
    return tagName !== "annotation-xml" && stringMatch(tagName, CUSTOM_ELEMENT2);
  };
  const _sanitizeAttributes = function _sanitizeAttributes2(currentNode) {
    _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
    const {
      attributes
    } = currentNode;
    if (!attributes || _isClobbered(currentNode)) {
      return;
    }
    const hookEvent = {
      attrName: "",
      attrValue: "",
      keepAttr: true,
      allowedAttributes: ALLOWED_ATTR,
      forceKeepAttr: void 0
    };
    let l = attributes.length;
    while (l--) {
      const attr = attributes[l];
      const {
        name,
        namespaceURI,
        value: attrValue
      } = attr;
      const lcName = transformCaseFunc(name);
      const initValue = attrValue;
      let value = name === "value" ? initValue : stringTrim(initValue);
      hookEvent.attrName = lcName;
      hookEvent.attrValue = value;
      hookEvent.keepAttr = true;
      hookEvent.forceKeepAttr = void 0;
      _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
      value = hookEvent.attrValue;
      if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name")) {
        _removeAttribute(name, currentNode);
        value = SANITIZE_NAMED_PROPS_PREFIX + value;
      }
      if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|title|textarea)/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (lcName === "attributename" && stringMatch(value, "href")) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (hookEvent.forceKeepAttr) {
        continue;
      }
      if (!hookEvent.keepAttr) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (SAFE_FOR_TEMPLATES) {
        arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
          value = stringReplace(value, expr, " ");
        });
      }
      const lcTag = transformCaseFunc(currentNode.nodeName);
      if (!_isValidAttribute(lcTag, lcName, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function") {
        if (namespaceURI) ;
        else {
          switch (trustedTypes.getAttributeType(lcTag, lcName)) {
            case "TrustedHTML": {
              value = trustedTypesPolicy.createHTML(value);
              break;
            }
            case "TrustedScriptURL": {
              value = trustedTypesPolicy.createScriptURL(value);
              break;
            }
          }
        }
      }
      if (value !== initValue) {
        try {
          if (namespaceURI) {
            currentNode.setAttributeNS(namespaceURI, name, value);
          } else {
            currentNode.setAttribute(name, value);
          }
          if (_isClobbered(currentNode)) {
            _forceRemove(currentNode);
          } else {
            arrayPop(DOMPurify.removed);
          }
        } catch (_) {
          _removeAttribute(name, currentNode);
        }
      }
    }
    _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
  };
  const _sanitizeShadowDOM = function _sanitizeShadowDOM2(fragment) {
    let shadowNode = null;
    const shadowIterator = _createNodeIterator(fragment);
    _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
    while (shadowNode = shadowIterator.nextNode()) {
      _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
      _sanitizeElements(shadowNode);
      _sanitizeAttributes(shadowNode);
      if (shadowNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM2(shadowNode.content);
      }
    }
    _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
  };
  DOMPurify.sanitize = function(dirty) {
    let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    let body = null;
    let importedNode = null;
    let currentNode = null;
    let returnNode = null;
    IS_EMPTY_INPUT = !dirty;
    if (IS_EMPTY_INPUT) {
      dirty = "<!-->";
    }
    if (typeof dirty !== "string" && !_isNode(dirty)) {
      if (typeof dirty.toString === "function") {
        dirty = dirty.toString();
        if (typeof dirty !== "string") {
          throw typeErrorCreate("dirty is not a string, aborting");
        }
      } else {
        throw typeErrorCreate("toString is not a function");
      }
    }
    if (!DOMPurify.isSupported) {
      return dirty;
    }
    if (!SET_CONFIG) {
      _parseConfig(cfg);
    }
    DOMPurify.removed = [];
    if (typeof dirty === "string") {
      IN_PLACE = false;
    }
    if (IN_PLACE) {
      if (dirty.nodeName) {
        const tagName = transformCaseFunc(dirty.nodeName);
        if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
          throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
        }
      }
    } else if (dirty instanceof Node2) {
      body = _initDocument("<!---->");
      importedNode = body.ownerDocument.importNode(dirty, true);
      if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") {
        body = importedNode;
      } else if (importedNode.nodeName === "HTML") {
        body = importedNode;
      } else {
        body.appendChild(importedNode);
      }
    } else {
      if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && // eslint-disable-next-line unicorn/prefer-includes
      dirty.indexOf("<") === -1) {
        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
      }
      body = _initDocument(dirty);
      if (!body) {
        return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
      }
    }
    if (body && FORCE_BODY) {
      _forceRemove(body.firstChild);
    }
    const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
    while (currentNode = nodeIterator.nextNode()) {
      _sanitizeElements(currentNode);
      _sanitizeAttributes(currentNode);
      if (currentNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM(currentNode.content);
      }
    }
    if (IN_PLACE) {
      return dirty;
    }
    if (RETURN_DOM) {
      if (RETURN_DOM_FRAGMENT) {
        returnNode = createDocumentFragment.call(body.ownerDocument);
        while (body.firstChild) {
          returnNode.appendChild(body.firstChild);
        }
      } else {
        returnNode = body;
      }
      if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
        returnNode = importNode.call(originalDocument, returnNode, true);
      }
      return returnNode;
    }
    let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
    if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
      serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
    }
    if (SAFE_FOR_TEMPLATES) {
      arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
        serializedHTML = stringReplace(serializedHTML, expr, " ");
      });
    }
    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
  };
  DOMPurify.setConfig = function() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    _parseConfig(cfg);
    SET_CONFIG = true;
  };
  DOMPurify.clearConfig = function() {
    CONFIG = null;
    SET_CONFIG = false;
  };
  DOMPurify.isValidAttribute = function(tag, attr, value) {
    if (!CONFIG) {
      _parseConfig({});
    }
    const lcTag = transformCaseFunc(tag);
    const lcName = transformCaseFunc(attr);
    return _isValidAttribute(lcTag, lcName, value);
  };
  DOMPurify.addHook = function(entryPoint, hookFunction) {
    if (typeof hookFunction !== "function") {
      return;
    }
    arrayPush(hooks[entryPoint], hookFunction);
  };
  DOMPurify.removeHook = function(entryPoint, hookFunction) {
    if (hookFunction !== void 0) {
      const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
      return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
    }
    return arrayPop(hooks[entryPoint]);
  };
  DOMPurify.removeHooks = function(entryPoint) {
    hooks[entryPoint] = [];
  };
  DOMPurify.removeAllHooks = function() {
    hooks = _createHooksMap();
  };
  return DOMPurify;
}
var purify = createDOMPurify();

// src/hooks/useFileValidation.ts
function useFileValidation({
  fileUrl,
  ajaxUrl,
  nonce,
  enabled = true,
  gitHubService = GitHubService
}) {
  const [status, setStatus] = useState3("idle");
  const [result, setResult] = useState3(null);
  const [error, setError] = useState3(null);
  const [errorCode, setErrorCode] = useState3(null);
  const abortControllerRef = useRef3(null);
  const isMountedRef = useRef3(true);
  const testFile = async (urlToTest) => {
    const url = urlToTest || fileUrl;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    if (isMountedRef.current) {
      setStatus("testing");
      setError(null);
      setErrorCode(null);
    }
    try {
      const testResult = await gitHubService.testFile(
        ajaxUrl,
        nonce,
        url,
        abortController.signal
      );
      if (abortController.signal.aborted) {
        return;
      }
      if (isMountedRef.current) {
        setStatus("ready");
        setResult(testResult);
      }
    } catch (e) {
      if (e.name === "AbortError") {
        return;
      }
      if (!abortController.signal.aborted && isMountedRef.current) {
        setStatus("error");
        let errorMessage = e instanceof Error ? e.message : getString("file.networkError");
        if (errorMessage.includes("not found in repository")) {
          errorMessage = "Release not found";
        } else if (errorMessage.includes("Repository not found")) {
          errorMessage = "Repository not found";
        } else if (errorMessage.includes("Asset not found")) {
          errorMessage = "File not found";
        } else if (errorMessage.includes("&quot;") || errorMessage.includes("&amp;")) {
          const sanitizedMessage = purify.sanitize(errorMessage);
          const textarea = document.createElement("textarea");
          textarea.innerHTML = sanitizedMessage;
          errorMessage = textarea.value;
          if (errorMessage.includes("not found in repository")) {
            errorMessage = "Release not found";
          } else if (errorMessage.includes("Repository not found")) {
            errorMessage = "Repository not found";
          } else if (errorMessage.includes("Asset not found")) {
            errorMessage = "File not found";
          }
        }
        setError(errorMessage);
        setErrorCode(e?.code || null);
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };
  useEffect4(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);
  return {
    status,
    result,
    error,
    errorCode,
    testFile
  };
}

// src/hooks/useFileInputMonitor.ts
import { useState as useState4, useEffect as useEffect5, useRef as useRef4 } from "react";
function useFileInputMonitor({
  initialUrl,
  rootElement,
  onUrlChange,
  debounceDelay = INTERVALS.DEBOUNCE,
  pollInterval = INTERVALS.POLL
}) {
  const [currentUrl, setCurrentUrl] = useState4(initialUrl);
  const isMountedRef = useRef4(true);
  useEffect5(() => {
    isMountedRef.current = true;
    const statusElement = rootElement || document.querySelector(`[data-file-url="${initialUrl}"]`);
    if (!statusElement) return;
    const wrapper = statusElement.closest(EDD_SELECTORS.UPLOAD_WRAPPER);
    if (!wrapper) return;
    const fileInput = wrapper.querySelector(EDD_SELECTORS.UPLOAD_FIELD);
    if (!fileInput) return;
    let debounceTimer = null;
    let lastValue = fileInput.value;
    const handleInputChange = () => {
      const newValue = fileInput.value;
      if (newValue === lastValue) return;
      lastValue = newValue;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      setCurrentUrl(newValue);
      if (newValue && newValue.startsWith(GITHUB_PROTOCOL)) {
        debounceTimer = window.setTimeout(() => {
          if (isMountedRef.current) {
            onUrlChange(newValue);
          }
        }, debounceDelay);
      } else {
        onUrlChange(newValue);
      }
    };
    fileInput.addEventListener("input", handleInputChange);
    fileInput.addEventListener("change", handleInputChange);
    const poll = window.setInterval(() => {
      const currentValue = fileInput.value;
      if (currentValue !== lastValue) {
        handleInputChange();
      }
    }, pollInterval);
    return () => {
      isMountedRef.current = false;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      clearInterval(poll);
      fileInput.removeEventListener("input", handleInputChange);
      fileInput.removeEventListener("change", handleInputChange);
    };
  }, [rootElement, initialUrl, onUrlChange, debounceDelay, pollInterval]);
  return { currentUrl };
}

// src/components/ProBadge.tsx
import React from "react";
var ProBadge = ({
  label,
  icon,
  showWrapper = true,
  renderAsLink = true,
  href,
  text: text2,
  status = "default",
  openInNewWindow = true
}) => {
  const badgeText = text2 || getString("common.getPro");
  const statusClass = status !== "default" ? ` arts-license-pro-badge_${status}` : "";
  const badgeClassName = `arts-license-pro-badge${statusClass}`;
  const shouldRenderAsLink = renderAsLink && href;
  const badge = shouldRenderAsLink ? /* @__PURE__ */ React.createElement(
    "a",
    {
      href,
      className: badgeClassName,
      "aria-label": `${badgeText} - Pro feature`,
      ...openInNewWindow && { target: "_blank", rel: "noopener noreferrer" }
    },
    badgeText
  ) : /* @__PURE__ */ React.createElement(
    "span",
    {
      className: badgeClassName,
      role: "status",
      "aria-label": `${badgeText} - Pro feature`
    },
    badgeText
  );
  if (!showWrapper) {
    return badge;
  }
  return /* @__PURE__ */ React.createElement("span", { className: "arts-license-pro-badge-wrapper" }, icon && /* @__PURE__ */ React.createElement("span", { className: `dashicons ${icon}`, role: "img", "aria-hidden": "true" }), label && /* @__PURE__ */ React.createElement("span", { className: "arts-license-pro-badge-wrapper__label" }, label), badge);
};

// src/settings/TokenField.tsx
import React2 from "react";
var { useState: useState5 } = wp.element;
var { TextControl, Button, Notice } = wp.components;
var TokenField = ({ initialValue, onChange }) => {
  const [value, setValue] = useState5(initialValue);
  const [showPassword, setShowPassword] = useState5(false);
  const [showInstructions, setShowInstructions] = useState5(false);
  const isConstantDefined = window.releaseDeployEDD.contexts.settings?.isConstantDefined || false;
  const ajaxUrl = window.releaseDeployEDD.ajaxUrl;
  const nonce = window.releaseDeployEDD.contexts.settings?.nonce || "";
  const { status, rateLimit, isLoadingRateLimit, validateToken, refreshStatus } = useTokenValidation({
    initialToken: initialValue,
    ajaxUrl,
    nonce,
    isConstantDefined
  });
  const handleChange = (newValue) => {
    setValue(newValue);
    onChange(newValue);
  };
  const handleBlur = () => {
    if (value && value.trim()) {
      validateToken(value);
    }
  };
  const handleRefresh = async () => {
    await refreshStatus(value || initialValue);
  };
  const getStatusContent = () => {
    if (status === "checking" || isLoadingRateLimit) {
      return {
        text: getString("token.checking"),
        icon: "release-deploy-edd-icon_loading",
        fullText: getString("token.checking"),
        isClickable: false
      };
    }
    if (status === "valid") {
      let fullText = getString("token.connected");
      if (rateLimit) {
        fullText += ` (${rateLimit.remaining}/${rateLimit.limit} ${getString("token.apiCalls")})`;
      }
      return {
        text: getString("token.connected"),
        icon: "release-deploy-edd-icon_success",
        fullText,
        isClickable: true
      };
    }
    if (status === "invalid") {
      return {
        text: getString("token.invalid"),
        icon: "release-deploy-edd-icon_error",
        fullText: getString("token.invalid"),
        isClickable: false
      };
    }
    return { text: "", icon: "", fullText: "", isClickable: false };
  };
  const statusContent = getStatusContent();
  return /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("div", { className: "release-deploy-edd-token-field" }, /* @__PURE__ */ React2.createElement(
    TextControl,
    {
      type: showPassword ? "text" : "password",
      value: isConstantDefined ? "" : value,
      onChange: handleChange,
      onBlur: handleBlur,
      maxLength: 255,
      placeholder: isConstantDefined ? getString("token.managedViaConstant") : "github_pat...",
      disabled: status === "checking" || isConstantDefined,
      help: isConstantDefined ? getString("token.constantHelp") : getString("token.enterHelp"),
      className: isConstantDefined ? "release-deploy-edd-token-field__input_constant" : ""
    }
  ), !isConstantDefined && /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowPassword(!showPassword),
      className: "release-deploy-edd-token-field__toggle",
      "aria-label": showPassword ? getString("token.hide") : getString("token.show")
    },
    /* @__PURE__ */ React2.createElement(
      "span",
      {
        className: `dashicons ${showPassword ? "dashicons-hidden" : "dashicons-visibility"}`
      }
    )
  )), /* @__PURE__ */ React2.createElement(
    "div",
    {
      className: `release-deploy-edd-token-status release-deploy-edd-token-status_${status}${statusContent.isClickable ? " release-deploy-edd-token-status_clickable" : ""}`,
      onClick: statusContent.isClickable ? handleRefresh : void 0,
      title: statusContent.isClickable ? getString("token.refresh") : ""
    },
    statusContent.icon && /* @__PURE__ */ React2.createElement("span", { className: `release-deploy-edd-token-status__icon ${statusContent.icon}` }),
    /* @__PURE__ */ React2.createElement("span", { className: "release-deploy-edd-token-status__text" }, statusContent.fullText)
  ), !isConstantDefined && /* @__PURE__ */ React2.createElement("div", { className: "release-deploy-edd-token-instructions-toggle" }, /* @__PURE__ */ React2.createElement(Button, { variant: "link", onClick: () => setShowInstructions(!showInstructions) }, showInstructions ? "\u25BC" : "\u25B6", " ", getString("token.howToCreate"))), showInstructions && !isConstantDefined && /* @__PURE__ */ React2.createElement(Notice, { status: "info" }, /* @__PURE__ */ React2.createElement("ol", { className: "release-deploy-edd-token-instructions" }, /* @__PURE__ */ React2.createElement("li", null, getString("token.instruction1")), /* @__PURE__ */ React2.createElement("li", null, getString("token.instruction2")), /* @__PURE__ */ React2.createElement("li", null, getString("token.instruction3")), /* @__PURE__ */ React2.createElement("li", null, getString("token.instruction4")), /* @__PURE__ */ React2.createElement("li", null, getString("token.instruction5")), /* @__PURE__ */ React2.createElement("li", null, getString("token.instruction6")))), !isConstantDefined && /* @__PURE__ */ React2.createElement("input", { type: "hidden", name: "edd_settings[edd_release_deploy_token]", value }));
};

// src/settings/SettingsApp.tsx
import React3 from "react";
var { useState: useState6 } = wp.element;
var SettingsApp = () => {
  const [token, setToken] = useState6(window.releaseDeployEDD?.contexts?.settings?.token || "");
  return /* @__PURE__ */ React3.createElement("div", { className: "release-deploy-edd-settings" }, /* @__PURE__ */ React3.createElement(TokenField, { initialValue: token, onChange: setToken }));
};

// src/metabox/inject-sync-ui.ts
function injectVersionSyncUI() {
  const metaboxData = window.releaseDeployEDD?.contexts?.metabox;
  if (!metaboxData?.versionSync?.enabled) {
    return;
  }
  setTimeout(() => {
    const versionField = document.querySelector(EDD_SELECTORS.VERSION_FIELD);
    if (!versionField) {
      return;
    }
    const isPro = window.releaseDeployEDD?.features?.versionSync || false;
    const rootSuffix = isPro ? "pro" : "free";
    const rootElement = document.createElement("div");
    rootElement.id = `release-deploy-edd-version-sync-${rootSuffix}-root`;
    rootElement.className = "release-deploy-edd-sync-root";
    const nextNode = versionField.nextSibling;
    if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
      versionField.parentNode?.insertBefore(rootElement, nextNode.nextSibling);
    } else {
      versionField.parentNode?.insertBefore(rootElement, versionField.nextSibling);
    }
    document.dispatchEvent(new CustomEvent("release-deploy-edd-version-sync-ready"));
  }, 100);
}
function injectChangelogSyncUI() {
  const metaboxData = window.releaseDeployEDD?.contexts?.metabox;
  if (!metaboxData?.changelogSync?.enabled) {
    return;
  }
  const changelogSyncData = metaboxData.changelogSync;
  setTimeout(() => {
    const changelogField = document.querySelector(EDD_SELECTORS.CHANGELOG_FIELD);
    if (!changelogField) {
      return;
    }
    const isPro = window.releaseDeployEDD?.features?.changelogSync || false;
    const rootSuffix = isPro ? "pro" : "free";
    const rootElement = document.createElement("div");
    rootElement.id = `release-deploy-edd-changelog-sync-${rootSuffix}-root`;
    rootElement.className = "release-deploy-edd-sync-root";
    const changelogLabel = document.querySelector(EDD_SELECTORS.CHANGELOG_LABEL);
    if (changelogLabel) {
      changelogLabel.appendChild(rootElement);
    } else {
      changelogField.parentNode?.insertBefore(rootElement, changelogField.nextSibling);
    }
    document.dispatchEvent(new CustomEvent("release-deploy-edd-changelog-sync-ready"));
  }, 100);
}

// src/metabox/FileStatus.tsx
import React4 from "react";
var FileStatus = ({ fileUrl: initialUrl, rootElement }) => {
  const ajaxUrl = window.releaseDeployEDD?.ajaxUrl || "";
  const nonce = window.releaseDeployEDD?.contexts?.settings?.nonce || window.releaseDeployEDD?.contexts?.browser?.nonce || "";
  const { status, result, error, errorCode, testFile } = useFileValidation({
    fileUrl: initialUrl,
    ajaxUrl,
    nonce,
    enabled: false
    // We'll trigger manually when URL changes
  });
  const noOp = React4.useCallback(() => {
  }, []);
  const { currentUrl } = useFileInputMonitor({
    initialUrl,
    rootElement,
    onUrlChange: noOp
    // Stable empty callback since we handle changes via useEffect
  });
  const lastTestedUrl = React4.useRef("");
  React4.useEffect(() => {
    if (currentUrl && currentUrl.startsWith(GITHUB_PROTOCOL)) {
      if (currentUrl !== lastTestedUrl.current) {
        lastTestedUrl.current = currentUrl;
        testFile(currentUrl);
      }
    }
  }, [currentUrl]);
  if (!currentUrl || !currentUrl.startsWith(GITHUB_PROTOCOL)) {
    return null;
  }
  if (status === "idle") {
    return null;
  }
  return /* @__PURE__ */ React4.createElement(
    "span",
    {
      onClick: () => status !== "testing" && testFile(currentUrl),
      className: `release-deploy-edd-file-status release-deploy-edd-file-status_${status}`,
      title: status === "ready" ? getString("file.retest") : status === "error" ? getString("file.retry") : ""
    },
    status === "testing" && /* @__PURE__ */ React4.createElement(React4.Fragment, null, /* @__PURE__ */ React4.createElement("span", { className: "release-deploy-edd-file-status__message" }, /* @__PURE__ */ React4.createElement("span", { className: "release-deploy-edd-icon_loading" }), getString("file.testing"))),
    status === "ready" && result && /* @__PURE__ */ React4.createElement("span", { className: "release-deploy-edd-file-status__message" }, /* @__PURE__ */ React4.createElement("span", { className: "release-deploy-edd-icon_success" }), getString("file.ready"), " (", formatSize(result.size), ")"),
    status === "error" && /* @__PURE__ */ React4.createElement(React4.Fragment, null, /* @__PURE__ */ React4.createElement("span", { className: "release-deploy-edd-file-status__message" }, /* @__PURE__ */ React4.createElement("span", { className: "release-deploy-edd-icon_error" }), error), errorCode === "pro_feature" && /* @__PURE__ */ React4.createElement(React4.Fragment, null, " ", /* @__PURE__ */ React4.createElement(
      ProBadge,
      {
        showWrapper: false,
        renderAsLink: true,
        href: window.releaseDeployEDD?.purchaseUrl || "#",
        text: getString("common.getPro"),
        status: "default"
      }
    )), error && error.toLowerCase().includes("token") && /* @__PURE__ */ React4.createElement(React4.Fragment, null, " ", /* @__PURE__ */ React4.createElement(
      ProBadge,
      {
        showWrapper: false,
        renderAsLink: true,
        href: window.releaseDeployEDD?.settingsUrl || "#",
        text: getString("common.fixIt"),
        status: "warning"
      }
    )))
  );
};

// src/version-sync/VersionSync.tsx
import React5 from "react";
var VersionSync = (_props) => {
  const purchaseUrl = window.releaseDeployEDD?.purchaseUrl || "";
  return /* @__PURE__ */ React5.createElement(
    ProBadge,
    {
      label: getString("sync.autoVersionSync"),
      icon: "dashicons-update",
      text: getString("common.getPro"),
      showWrapper: true,
      renderAsLink: true,
      href: purchaseUrl,
      status: "default",
      openInNewWindow: true
    }
  );
};

// src/version-sync/init.tsx
import React6 from "react";
var { render } = wp.element;
var initVersionSync = () => {
  const container = document.getElementById("release-deploy-edd-version-sync-free-root");
  if (!container) {
    return;
  }
  const downloadId = parseInt(container.dataset["downloadId"] || "0");
  const nonce = container.dataset["nonce"] || "";
  const ajaxUrl = container.dataset["ajaxUrl"] || window.ajaxurl;
  render(
    /* @__PURE__ */ React6.createElement(
      VersionSync,
      {
        downloadId,
        currentVersion: "",
        githubVersion: "",
        lastSync: 0,
        nonce,
        ajaxUrl,
        isFeatureAvailable: false
      }
    ),
    container
  );
};

// src/changelog-sync/ChangelogSync.tsx
import React7 from "react";
var ChangelogSync = (_props) => {
  const purchaseUrl = window.releaseDeployEDD?.purchaseUrl || "";
  return /* @__PURE__ */ React7.createElement(
    ProBadge,
    {
      label: getString("sync.autoChangelogSync"),
      icon: "dashicons-media-document",
      text: getString("common.getPro"),
      showWrapper: true,
      renderAsLink: true,
      href: purchaseUrl,
      status: "default",
      openInNewWindow: true
    }
  );
};

// src/changelog-sync/init.tsx
import React8 from "react";
var { render: render2 } = wp.element;
var initChangelogSync = () => {
  const container = document.getElementById("release-deploy-edd-changelog-sync-free-root");
  if (!container) {
    return;
  }
  const downloadId = parseInt(container.dataset["downloadId"] || "0");
  const nonce = container.dataset["nonce"] || "";
  const ajaxUrl = container.dataset["ajaxUrl"] || window.ajaxurl;
  render2(
    /* @__PURE__ */ React8.createElement(
      ChangelogSync,
      {
        downloadId,
        nonce,
        ajaxUrl,
        isFeatureAvailable: false,
        lastSync: 0,
        isLinked: false
      }
    ),
    container
  );
};
export {
  API_ACTIONS,
  ChangelogSync,
  EDD_SELECTORS,
  FileStatus,
  GITHUB_PROTOCOL,
  GitHubService,
  INTERVALS,
  ProBadge,
  SIZE_UNITS,
  SettingsApp,
  TRANSLATION_FALLBACKS,
  TokenField,
  VersionSync,
  buildGitHubUrl,
  createGitHubService,
  formatSize,
  getContextLabel,
  getErrorMessage,
  getString,
  handleError,
  initChangelogSync,
  initVersionSync,
  injectChangelogSyncUI,
  injectVersionSyncUI,
  parseGitHubUrl,
  useFileInputMonitor,
  useFileValidation,
  useGitHubFiles,
  usePolling,
  useTimeouts,
  useTokenValidation
};
/* v8 ignore next 3 -- @preserve */
/*! Bundled license information:

dompurify/dist/purify.es.mjs:
  (*! @license DOMPurify 3.3.0 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.0/LICENSE *)
*/
