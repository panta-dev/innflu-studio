// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
};

// node_modules/hono/dist/utils/body.js
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = (request) => "headers" in request;
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded")
    return parseFormData(request, {
      all,
      dot
    });
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData)
    return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request))
    request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData)
    return convertFormDataToBodyData(formData, options);
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    if (!(options.all || key.endsWith("[]")))
      form[key] = value;
    else
      handleParsingAllValues(form, key, value);
  });
  if (options.dot)
    Object.entries(form).forEach(([key, value]) => {
      if (key.includes(".")) {
        handleParsingNestedValues(form, key, value, nestingState);
        delete form[key];
      }
    });
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key]))
      form[key].push(value);
    else
      form[key] = [form[key], value];
  } else if (!key.endsWith("[]"))
    form[key] = value;
  else
    form[key] = [value];
};
var handleParsingNestedValues = (form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key))
    return;
  let nestedForm = form;
  const keys = key.split(".", 34);
  if (keys.length > 33)
    throwNestingLimitExceeded();
  keys.forEach((key2, index) => {
    if (index === keys.length - 1)
      nestedForm[key2] = value;
    else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS)
          throwNestingLimitExceeded();
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var throwNestingLimitExceeded = () => {
  throw new Error("Nesting limit exceeded");
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "")
    paths.shift();
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return {
    groups,
    path
  };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--)
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*")
    return "*";
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2])
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
          cacheKey,
          match2[1],
          new RegExp(`^${match2[2]}(?=/${next})`)
        ] : [
          label,
          match2[1],
          new RegExp(`^${match2[2]}$`)
        ];
      else
        patternCache[cacheKey] = [
          label,
          match2[1],
          true
        ];
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35)
      break;
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length)
    sub = mergePath(sub, ...rest);
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":"))
    return null;
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment))
      basePath += "/" + segment;
    else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "")
          results.push("/");
        else
          results.push(basePath);
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else
        basePath += "/" + segment;
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str;
var _decodeURI = (value) => {
  if (value.indexOf("+") !== -1)
    value = value.replace(/\+/g, " ");
  return tryDecodeURIComponent(value);
};
var _getQueryParam = (url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1)
    url = url.slice(0, hashIndex);
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1)
      return;
    if (!url.startsWith(key, keyIndex2 + 1))
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode))
        return "";
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded)
      return;
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1)
      valueIndex = -1;
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
    if (encoded)
      name = _decodeURI(name);
    keyIndex = nextKeyIndex;
    if (name === "")
      continue;
    let value;
    if (valueIndex === -1)
      value = "";
    else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded)
        value = _decodeURI(value);
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name])))
        results[name] = [];
      results[name].push(value);
    } else
      results[name] ??= value;
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = class {
  /**
  * `.raw` can get the raw Request object.
  *
  * @see {@link https://hono.dev/docs/api/request#raw}
  *
  * @example
  * ```ts
  * // For Cloudflare Workers
  * app.post('/', async (c) => {
  *   const metadata = c.req.raw.cf?.hostMetadata?
  *   ...
  * })
  * ```
  */
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  /**
  * `.path` can get the pathname of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#path}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const pathname = c.req.path // `/about/me`
  * })
  * ```
  */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0)
        decoded[key] = tryDecodeURIComponent(value);
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name)
      return this.raw.headers.get(name) ?? void 0;
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody)
      return cachedBody;
    for (const anyCachedKey in bodyCache)
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json")
          body = JSON.stringify(body);
        const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
        return new Response(body, { headers: contentType ? { "Content-Type": contentType } : void 0 })[key]();
      });
    return bodyCache[key] = raw2[key]();
  };
  /**
  * `.json()` can parse Request body of type `application/json`
  *
  * @see {@link https://hono.dev/docs/api/request#json}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.json()
  * })
  * ```
  */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
  * `.text()` can parse Request body of type `text/plain`
  *
  * @see {@link https://hono.dev/docs/api/request#text}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.text()
  * })
  * ```
  */
  text() {
    return this.#cachedBody("text");
  }
  /**
  * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
  *
  * @see {@link https://hono.dev/docs/api/request#arraybuffer}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.arrayBuffer()
  * })
  * ```
  */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
  * `.bytes()` parses the request body as a `Uint8Array`.
  *
  * @see {@link https://hono.dev/docs/api/request#bytes}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.bytes()
  * })
  * ```
  */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
  * Parses the request body as a `Blob`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.blob();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#blob
  */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
  * Parses the request body as `FormData`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.formData();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#formdata
  */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
  * Adds validated data to the request.
  *
  * @param target - The target of the validation.
  * @param data - The validated data to add.
  */
  addValidatedData(target, data) {
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
  * `.url` can get the request url strings.
  *
  * @see {@link https://hono.dev/docs/api/request#url}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const url = c.req.url // `http://localhost:8787/about/me`
  *   ...
  * })
  * ```
  */
  get url() {
    return this.raw.url;
  }
  /**
  * `.method` can get the method name of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#method}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const method = c.req.method // `GET`
  * })
  * ```
  */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
  * `.matchedRoutes` can return a matched route in the handler
  *
  * @deprecated
  *
  * Use matchedRoutes helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#matchedroutes}
  *
  * @example
  * ```ts
  * app.use('*', async function logger(c, next) {
  *   await next()
  *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
  *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
  *     console.log(
  *       method,
  *       ' ',
  *       path,
  *       ' '.repeat(Math.max(10 - path.length, 0)),
  *       name,
  *       i === c.req.routeIndex ? '<- respond from here' : ''
  *     )
  *   })
  * })
  * ```
  */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
  * `.routePath` can retrieve the path registered within the handler
  *
  * @deprecated
  *
  * Use routePath helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#routepath}
  *
  * @example
  * ```ts
  * app.get('/posts/:id', (c) => {
  *   return c.json({ path: c.req.routePath })
  * })
  * ```
  */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise))
      str = str.toString();
    if (str instanceof Promise)
      str = await str;
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length)
    return Promise.resolve(str);
  if (buffer)
    buffer[0] += str;
  else
    buffer = [str];
  const resStr = Promise.all(callbacks.map((c) => c({
    phase,
    buffer,
    context
  }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks)
    return raw(await resStr, callbacks);
  else
    return resStr;
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
  * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
  *
  * @see {@link https://hono.dev/docs/api/context#env}
  *
  * @example
  * ```ts
  * // Environment object for Cloudflare Workers
  * app.get('*', async c => {
  *   const counter = c.env.COUNTER
  * })
  * ```
  */
  env = {};
  #var;
  finalized = false;
  /**
  * `.error` can get the error object from the middleware if the Handler throws an error.
  *
  * @see {@link https://hono.dev/docs/api/context#error}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   await next()
  *   if (c.error) {
  *     // do something...
  *   }
  * })
  * ```
  */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
  * Creates an instance of the Context class.
  *
  * @param req - The Request object.
  * @param options - Optional configuration options for the context.
  */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
  * `.req` is the instance of {@link HonoRequest}.
  */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#event}
  * The FetchEvent associated with the current request.
  *
  * @throws Will throw an error if the context does not have a FetchEvent.
  */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx)
      return this.#executionCtx;
    else
      throw Error("This context has no FetchEvent");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#executionctx}
  * The ExecutionContext associated with the current request.
  *
  * @throws Will throw an error if the context does not have an ExecutionContext.
  */
  get executionCtx() {
    if (this.#executionCtx)
      return this.#executionCtx;
    else
      throw Error("This context has no ExecutionContext");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#res}
  * The Response object for the current request.
  */
  get res() {
    return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
  }
  /**
  * Sets the Response object for the current request.
  *
  * @param _res - The Response object to set.
  */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type")
          continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies)
            _res.headers.append("set-cookie", cookie);
        } else
          _res.headers.set(k, v);
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
  * `.render()` can create a response within a layout.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   return c.render('Hello!')
  * })
  * ```
  */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
  * Sets the layout for the response.
  *
  * @param layout - The layout to set.
  * @returns The layout function.
  */
  setLayout = (layout) => this.#layout = layout;
  /**
  * Gets the current layout for the response.
  *
  * @returns The current layout function.
  */
  getLayout = () => this.#layout;
  /**
  * `.setRenderer()` can set the layout in the custom middleware.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```tsx
  * app.use('*', async (c, next) => {
  *   c.setRenderer((content) => {
  *     return c.html(
  *       <html>
  *         <body>
  *           <p>{content}</p>
  *         </body>
  *       </html>
  *     )
  *   })
  *   await next()
  * })
  * ```
  */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
  * `.header()` can set headers.
  *
  * @see {@link https://hono.dev/docs/api/context#header}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *
  *   // Append multiple headers using the append option (e.g. Vary)
  *   c.header('Vary', 'Accept-Encoding', { append: true })
  *   c.header('Vary', 'User-Agent', { append: true })
  *
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  header = (name, value, options) => {
    if (this.finalized)
      this.#res = createResponseInstance(this.#res.body, this.#res);
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0)
      headers.delete(name);
    else if (options?.append)
      headers.append(name, value);
    else
      headers.set(name, value);
  };
  status = (status) => {
    this.#status = status;
  };
  /**
  * `.set()` can set the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   c.set('message', 'Hono is hot!!')
  *   await next()
  * })
  * ```
  */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
  * `.get()` can use the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   const message = c.get('message')
  *   return c.text(`The message is "${message}"`)
  * })
  * ```
  */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
  * `.var` can access the value of a variable.
  *
  * @see {@link https://hono.dev/docs/api/context#var}
  *
  * @example
  * ```ts
  * const result = c.var.client.oneMethod()
  * ```
  */
  get var() {
    if (!this.#var)
      return {};
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers))
        if (key === "set-cookie")
          responseHeaders.append(key, value);
        else
          responseHeaders.set(key, value);
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers)
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
      }
      if (responseHeaders)
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string")
            responseHeaders.set(k, v);
          else {
            responseHeaders.delete(k);
            for (const v2 of v)
              responseHeaders.append(k, v2);
          }
        }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
  * `.body()` can return the HTTP response.
  * You can set headers with `.header()` and set HTTP status code with `.status`.
  * This can also be set in `.text()`, `.json()` and so on.
  *
  * @see {@link https://hono.dev/docs/api/context#body}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *   // Set HTTP status code
  *   c.status(201)
  *
  *   // Return the response body
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
  * `.text()` can render text as `Content-Type:text/plain`.
  *
  * @see {@link https://hono.dev/docs/api/context#text}
  *
  * @example
  * ```ts
  * app.get('/say', (c) => {
  *   return c.text('Hello!')
  * })
  * ```
  */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
  };
  /**
  * `.json()` can render JSON as `Content-Type:application/json`.
  *
  * @see {@link https://hono.dev/docs/api/context#json}
  *
  * @example
  * ```ts
  * app.get('/api', (c) => {
  *   return c.json({ message: 'Hello!' })
  * })
  * ```
  */
  json = (object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
  * `.redirect()` can Redirect, default status code is 302.
  *
  * @see {@link https://hono.dev/docs/api/context#redirect}
  *
  * @example
  * ```ts
  * app.get('/redirect', (c) => {
  *   return c.redirect('/')
  * })
  * app.get('/redirect-permanently', (c) => {
  *   return c.redirect('/', 301)
  * })
  * ```
  */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  };
  /**
  * `.notFound()` can return the Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/context#notfound}
  *
  * @example
  * ```ts
  * app.get('/notfound', (c) => {
  *   return c.notFound()
  * })
  * ```
  */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index)
        throw new Error("next() called multiple times");
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else
        handler = i === middleware.length && next || void 0;
      if (handler)
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else
            throw err;
        }
      else if (context.finalized === false && onNotFound)
        res = await onNotFound(context);
      if (res && (context.finalized === false || isError))
        context.res = res;
      return context;
    }
  };
};

// node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class Hono2 {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string")
          this.#path = args1;
        else
          this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers)
            this.#addRoute(methodName, this.#path, handler);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string")
        this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute("ALL", this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono2({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  /**
  * `.route()` allows grouping other Hono instance in routes.
  *
  * @see {@link https://hono.dev/docs/api/routing#grouping}
  *
  * @param {string} path - base Path
  * @param {Hono} app - other Hono instance
  * @returns {Hono} routed Hono instance
  *
  * @example
  * ```ts
  * const app = new Hono()
  * const app2 = new Hono()
  *
  * app2.get("/user", (c) => c.text("user"))
  * app.route("/api", app2) // GET /api/user
  * ```
  */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler)
        handler = r.handler;
      else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
  * `.basePath()` allows base paths to be specified.
  *
  * @see {@link https://hono.dev/docs/api/routing#base-path}
  *
  * @param {string} path - base Path
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * const api = new Hono().basePath('/api')
  * ```
  */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
  * `.onError()` handles an error and returns a customized Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#error-handling}
  *
  * @param {ErrorHandler} handler - request Handler for error
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.onError((err, c) => {
  *   console.error(`${err}`)
  *   return c.text('Custom Error Message', 500)
  * })
  * ```
  */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
  * `.notFound()` allows you to customize a Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#not-found}
  *
  * @param {NotFoundHandler} handler - request handler for not-found
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.notFound((c) => {
  *   return c.text('Custom 404 Message', 404)
  * })
  * ```
  */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
  * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
  *
  * @deprecated Use `mount()` from `hono/mount` instead. `.mount()` will be removed in v5.
  *
  * @see {@link https://hono.dev/docs/api/hono#mount}
  *
  * @param {string} path - base Path
  * @param {Function} applicationHandler - other Request Handler
  * @param {MountOptions} [options] - options of `.mount()`
  * @returns {Hono} mounted Hono instance
  *
  * @example
  * ```ts
  * import { Router as IttyRouter } from 'itty-router'
  * import { Hono } from 'hono'
  * // Create itty-router application
  * const ittyRouter = IttyRouter()
  * // GET /itty-router/hello
  * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
  *
  * const app = new Hono()
  * app.mount('/itty-router', ittyRouter.handle)
  * ```
  *
  * @example
  * ```ts
  * const app = new Hono()
  * // Send the request to another application without modification.
  * app.mount('/app', anotherApp, {
  *   replaceRequest: (req) => req,
  * })
  * ```
  */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function")
        optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false)
          replaceRequest = (request) => request;
        else
          replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res)
        return res;
      await next();
    };
    this.#addRoute("ALL", mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error)
      return this.errorHandler(err, c);
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD")
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized)
          throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
  * `.fetch()` will be entry point of your app.
  *
  * @see {@link https://hono.dev/docs/api/hono#fetch}
  *
  * @param {Request} request - request Object of request
  * @param {Env} env - env Object
  * @param {ExecutionContext} executionCtx - context of execution
  * @returns {Response | Promise<Response>} response of request
  *
  */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
  * `.request()` is a useful method for testing.
  * You can pass a URL or pathname to send a GET request.
  * app will return a Response object.
  * ```ts
  * test('GET /hello is ok', async () => {
  *   const res = await app.request('/hello')
  *   expect(res.status).toBe(200)
  * })
  * ```
  * @see https://hono.dev/docs/api/hono#request
  */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request)
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  };
  /**
  * `.fire()` automatically adds a global fetch event listener.
  * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
  * @deprecated
  * Use `fire` from `hono/service-worker` instead.
  * ```ts
  * import { Hono } from 'hono'
  * import { fire } from 'hono/service-worker'
  *
  * const app = new Hono()
  * // ...
  * fire(app)
  * ```
  * @see https://hono.dev/docs/api/hono#fire
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
  */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/utils.js
var createNullObject = () => /* @__PURE__ */ Object.create(null);

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = (method2, path2) => {
    const matcher = matchers[method2] || matchers["ALL"];
    const staticMatch = matcher[2][path2];
    if (staticMatch)
      return staticMatch;
    const match3 = path2.match(matcher[0]);
    if (!match3)
      return [[], emptyParam];
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  };
  this.match = match2;
  return match2(method, path);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1)
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  if (b.length === 1)
    return 1;
  if (a === ".*" || a === "(?:|/.*)")
    return b === "(?:|/.*)" ? -1 : 1;
  else if (b === ".*" || b === "(?:|/.*)")
    return -1;
  if (a === "[^/]+")
    return 1;
  else if (b === "[^/]+")
    return -1;
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class Node2 {
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? [
        "",
        "",
        ".*"
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name && pattern[2]) {
          if (regexpStr === ".*")
            throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr))
            throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr))
            throw PATH_ERROR;
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ".*" && regexpStr !== "(?:|/.*)") {
            for (const k in node.#children)
              if ((regexpStr.length > 1 || k.length > 1) && k !== ".*" && k !== "(?:|/.*)")
                throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node2();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children)
            if (k.length > 1 && k !== ".*" && k !== "(?:|/.*)")
              throw PATH_ERROR;
          nextNode = node.#children[token] = new Node2();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0)
      throw PATH_ERROR;
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1)
      strList.unshift(`#${this.#index}`);
    if (strList.length === 0)
      return "";
    if (strList.length === 1)
      return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced)
        break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--)
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "")
      return [
        /^$/,
        [],
        []
      ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(`^${path.replace(/\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g, (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ".*" : `/:${LABEL_REG_EXP_STR}`)}$`);
}
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length))
    if (buildWildcardRegExp(k).test(path))
      return [...middleware[k]];
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { ["ALL"]: createNullObject() };
    this.#routes = { ["ALL"]: createNullObject() };
    this.#tries = { ["ALL"]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware)
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap["ALL"]) {
          handlerMap[method][p] = [...handlerMap["ALL"][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*")
      path = "*";
    const methods = method === "ALL" ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods)
        if (!middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware["ALL"], path) || [];
        }
      for (const handlerMap of [middleware, routes])
        for (const m of methods)
          for (const p in handlerMap[m])
            re.test(p) && handlerMap[m][p].push([handler, path]);
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths)
      for (const m of methods) {
        if (!routes[m][path2]) {
          this.#insertPath(m, path2);
          routes[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware["ALL"], path2) || [];
        }
        routes[m][path2].push([handler, path2]);
      }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes))
      matchers[method] = this.#buildMatcher(method);
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes])
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
          continue;
        }
        handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [h, trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
          map[key] = paramReplacementMap[pathData[1][i][1]];
          return map;
        }, createNullObject())]);
      }
    return [
      regexp,
      indexReplacementMap.map((i) => handlerData[i]),
      staticMap
    ];
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes)
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path,
      handler
    ]);
  }
  match(method, path) {
    if (!this.#routes)
      throw new Error("Fatal error");
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++)
          router.add(...routes[i2]);
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError)
          continue;
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len)
      throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1)
      throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node3 = class Node4 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new Node4();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam)
        possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"])
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else
            tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true)
            continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"])
                this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"])
                this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1])
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node = new Node3();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path])
      this.#node.insert(method, result, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono3 = class extends Hono {
  /**
  * Creates an instance of the Hono class.
  *
  * @param options - Optional configuration options for the Hono instance.
  */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const opts = {
    origin: "*",
    allowMethods: [
      "GET",
      "HEAD",
      "PUT",
      "POST",
      "DELETE",
      "PATCH",
      "QUERY"
    ],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const exposeHeadersStr = opts.exposeHeaders?.length ? opts.exposeHeaders.join(",") : void 0;
  const allowHeadersStr = opts.allowHeaders?.length ? opts.allowHeaders.join(",") : void 0;
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*")
        return () => optsOrigin;
      else
        return (origin) => optsOrigin === origin ? origin : null;
    } else if (typeof optsOrigin === "function")
      return optsOrigin;
    else
      return (origin) => optsOrigin.includes(origin) ? origin : null;
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function")
      return async (origin, c) => (await optsAllowMethods(origin, c)).join(",");
    else if (Array.isArray(optsAllowMethods)) {
      const methodsStr = optsAllowMethods.join(",");
      return () => methodsStr;
    } else
      return () => "";
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin)
      set("Access-Control-Allow-Origin", allowOrigin);
    if (opts.credentials)
      set("Access-Control-Allow-Credentials", "true");
    if (exposeHeadersStr)
      set("Access-Control-Expose-Headers", exposeHeadersStr);
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*")
        c.res.headers.append("Vary", "Origin");
      if (opts.maxAge != null)
        set("Access-Control-Max-Age", opts.maxAge.toString());
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods)
        set("Access-Control-Allow-Methods", allowMethods);
      let headersStr = allowHeadersStr;
      if (!headersStr) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders)
          headersStr = requestHeaders.split(",").map((h) => h.trim()).join(",");
      }
      if (headersStr) {
        set("Access-Control-Allow-Headers", headersStr);
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*")
      c.header("Vary", "Origin", { append: true });
  };
};

// src/ai.ts
async function analyzeProfileWithAI(aiBinding, fullName, bio, targetNiche) {
  if (!aiBinding) {
    return analyzeProfileWithHeuristics(fullName, bio, targetNiche);
  }
  try {
    const prompt = `Voc\xEA \xE9 um classificador especializado em perfis do Instagram no Brasil para marketing de influ\xEAncia.
Analise os dados do perfil abaixo e retorne ESTRITAMENTE um JSON com as chaves:
- "isFemale": boolean (true se for perfil pessoal de mulher/m\xE3e, false caso seja homem ou empresa/loja)
- "isBrand": boolean (true se for loja, e-commerce, cl\xEDnica ou marca comercial; false se for pessoa f\xEDsica/criadora de conte\xFAdo)
- "niche": string (o nicho principal identificado, ex: "maternidade", "moda", "fitness", "beleza", "outro")
- "confidence": number (de 0.0 a 1.0)
- "reason": string (resumo em 1 frase curta)

Perfil a analisar:
Nome de Exibi\xE7\xE3o: "${fullName}"
Biografia: "${bio}"
Nicho Alvo Esperado: "${targetNiche}"

Responda APENAS com o JSON, sem markdown ou explica\xE7\xF5es externas.`;
    const response = await aiBinding.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "Voc\xEA responde apenas objetos JSON v\xE1lidos." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 256
    });
    const text = response?.response || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isFemale: Boolean(parsed.isFemale),
        isBrand: Boolean(parsed.isBrand),
        niche: String(parsed.niche || "desconhecido"),
        confidence: Number(parsed.confidence || 0.8),
        reason: String(parsed.reason || "Classificado via Workers AI")
      };
    }
  } catch (err) {
    console.error("Falha ao rodar Workers AI, recorrendo \xE0 heur\xEDstica:", err);
  }
  return analyzeProfileWithHeuristics(fullName, bio, targetNiche);
}
function analyzeProfileWithHeuristics(fullName, bio, targetNiche) {
  const bioLower = (bio || "").toLowerCase();
  const nameLower = (fullName || "").toLowerCase();
  const brandKeywords = [
    "loja",
    "marca",
    "comercial",
    "contato@",
    "vendas",
    "encomendas",
    "frete gr\xE1tis",
    "compre aqui",
    "cl\xEDnica",
    "assessoria",
    "ag\xEAncia",
    "oficial"
  ];
  const isBrand = brandKeywords.some((kw) => bioLower.includes(kw) || nameLower.includes(kw));
  const femaleKeywords = [
    "m\xE3e",
    "mae",
    "mam\xE3e",
    "mamae",
    "materno",
    "maternidade",
    "ela/dela",
    "gestante",
    "gravidinha",
    "nutricionista",
    "advogada",
    "psic\xF3loga",
    "criadora",
    "fot\xF3grafa",
    "influencer",
    "esposa",
    "filha"
  ];
  const femaleMatches = femaleKeywords.filter((kw) => bioLower.includes(kw)).length;
  const isFemale = femaleMatches > 0 || !isBrand;
  return {
    isFemale,
    isBrand,
    niche: targetNiche || "geral",
    confidence: isBrand ? 0.9 : 0.75,
    reason: isBrand ? "Detectado vocabul\xE1rio de loja/marca" : `Classificado por termos na bio (${femaleMatches} termos encontrados)`
  };
}

// src/index.ts
var app = new Hono3();
app.use("*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = "innflu_secure_salt_2026";
  const data = enc.encode(password + salt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function generateToken(prefix = "inf") {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const str = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${str}`;
}
async function getAuthUser(db, c) {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || c.req.header("X-API-Key") || c.req.query("api_token") || c.req.query("token") || "";
  if (token) {
    const sessionUser = await db.prepare(`
      SELECT u.id, u.email, u.full_name, u.company_name, u.plan, u.api_token, u.avatar_url
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
    `).bind(token).first();
    if (sessionUser)
      return sessionUser;
    const apiUser = await db.prepare(`
      SELECT id, email, full_name, company_name, plan, api_token, avatar_url
      FROM users
      WHERE api_token = ?
    `).bind(token).first();
    if (apiUser)
      return apiUser;
  }
  return null;
}
app.get("/login", (c) => {
  return c.redirect("/login.html");
});
app.get("/dashboard", (c) => {
  return c.redirect("/dashboard/");
});
app.post("/api/auth/register", async (c) => {
  const db = c.env.DB;
  if (!db)
    return c.json({ error: "Banco de dados D1 n\xE3o configurado. Vincule o banco D1 (com a vari\xE1vel DB) nas configura\xE7\xF5es do Cloudflare Pages." }, 500);
  const body = await c.req.json();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const fullName = (body.full_name || body.name || "Usu\xE1rio Innflu").trim();
  const companyName = (body.company_name || "").trim();
  if (!email || !password || password.length < 6) {
    return c.json({ error: "E-mail v\xE1lido e senha com no m\xEDnimo 6 caracteres s\xE3o obrigat\xF3rios" }, 400);
  }
  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return c.json({ error: "Este e-mail j\xE1 est\xE1 cadastrado na plataforma" }, 409);
  }
  const userId = "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
  const passwordHash = await hashPassword(password);
  const apiToken = generateToken("inf_live");
  const sessionToken = generateToken("ses");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString();
  try {
    await db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, company_name, plan, api_token, avatar_url)
      VALUES (?, ?, ?, ?, ?, 'pro', ?, NULL)
    `).bind(userId, email, passwordHash, fullName, companyName, apiToken).run();
    await db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind("ses_" + Date.now(), userId, sessionToken, expiresAt).run();
    await db.prepare(`
      INSERT INTO campaigns (id, user_id, name, keyword, target_gender, min_followers, max_followers, require_active_stories, daily_limit, min_delay_sec, max_delay_sec, status)
      VALUES (?, ?, 'Campanha Maternidade & Mam\xE3es', 'maternidade', 'female', 10000, 10000000, 1, 40, 60, 180, 'active')
    `).bind("camp_" + userId + "_01", userId).run();
    await db.prepare(`
      INSERT INTO templates (id, user_id, campaign_id, title, content, is_active)
      VALUES (?, ?, ?, 'Convite Parceria Maternidade', ?, 1)
    `).bind(
      "tmpl_" + userId + "_01",
      userId,
      "camp_" + userId + "_01",
      "{Ol\xE1|Oi|Oie} {nome}! {Tudo bem com voc\xEA?|Como voc\xEA est\xE1?|Espero que esteja tudo bem!}\n\nVi seu perfil e adorei o conte\xFAdo que voc\xEA compartilha sobre maternidade! {Estou muito encantada com sua rotina.|Achei suas publica\xE7\xF5es super aut\xEAnticas e acolhedoras.}\n\nSomos uma marca e gostar\xEDamos de te convidar para uma parceria com envio de produtos exclusivos sem nenhum custo. Voc\xEA teria interesse em conhecer mais da nossa proposta?"
    ).run();
    return c.json({
      success: true,
      message: "Conta criada com sucesso!",
      token: sessionToken,
      user: {
        id: userId,
        email,
        full_name: fullName,
        company_name: companyName,
        plan: "pro",
        api_token: apiToken,
        avatar_url: null
      }
    });
  } catch (err) {
    return c.json({ error: "Erro ao criar conta: " + err.message }, 500);
  }
});
app.post("/api/auth/login", async (c) => {
  const db = c.env.DB;
  if (!db)
    return c.json({ error: "Banco de dados D1 n\xE3o configurado. Vincule o banco D1 (com a vari\xE1vel DB) nas configura\xE7\xF5es do Cloudflare Pages." }, 500);
  const body = await c.req.json();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) {
    return c.json({ error: "Informe e-mail e senha" }, 400);
  }
  const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (!user) {
    return c.json({ error: "E-mail ou senha incorretos" }, 401);
  }
  const computedHash = await hashPassword(password);
  if (computedHash !== user.password_hash) {
    return c.json({ error: "E-mail ou senha incorretos" }, 401);
  }
  const sessionToken = generateToken("ses");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString();
  await db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind("ses_" + Date.now(), user.id, sessionToken, expiresAt).run();
  return c.json({
    success: true,
    message: "Login realizado com sucesso!",
    token: sessionToken,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      company_name: user.company_name,
      plan: user.plan,
      api_token: user.api_token,
      avatar_url: user.avatar_url || null
    }
  });
});
app.get("/api/auth/me", async (c) => {
  const db = c.env.DB;
  if (!db)
    return c.json({ error: "DB n\xE3o configurado" }, 500);
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || c.req.query("token") || c.req.header("X-API-Key") || "";
  if (!token) {
    return c.json({ authenticated: false, error: "Token n\xE3o fornecido" }, 401);
  }
  let user = await db.prepare(`
    SELECT u.id, u.email, u.full_name, u.company_name, u.plan, u.api_token, u.avatar_url, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
  `).bind(token).first();
  if (!user) {
    user = await db.prepare(`
      SELECT id, email, full_name, company_name, plan, api_token, avatar_url, created_at
      FROM users
      WHERE api_token = ?
    `).bind(token).first();
  }
  if (!user) {
    return c.json({ authenticated: false, error: "Sess\xE3o inv\xE1lida ou expirada" }, 401);
  }
  return c.json({
    authenticated: true,
    user
  });
});
app.post("/api/auth/logout", async (c) => {
  const db = c.env.DB;
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (db && token) {
    await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
  return c.json({ success: true, message: "Logout efetuado" });
});
app.get("/api/user/profile", async (c) => {
  const db = c.env.DB;
  if (!db)
    return c.json({ error: "DB n\xE3o configurado" }, 500);
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autenticado" }, 401);
  }
  const profile = await db.prepare(`
    SELECT id, email, full_name, company_name, plan, api_token, avatar_url, created_at
    FROM users WHERE id = ?
  `).bind(user.id).first();
  return c.json({ success: true, user: profile });
});
app.put("/api/user/profile", async (c) => {
  const db = c.env.DB;
  if (!db)
    return c.json({ error: "DB n\xE3o configurado" }, 500);
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autenticado" }, 401);
  }
  const body = await c.req.json();
  const fullName = (body.full_name || user.full_name || "").trim();
  const companyName = body.company_name !== void 0 ? (body.company_name || "").trim() : user.company_name || "";
  const email = (body.email || user.email || "").trim().toLowerCase();
  const avatarUrl = body.avatar_url !== void 0 ? body.avatar_url : user.avatar_url || null;
  if (!email || !fullName) {
    return c.json({ error: "Nome e E-mail s\xE3o obrigat\xF3rios" }, 400);
  }
  if (email !== user.email) {
    const existing = await db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").bind(email, user.id).first();
    if (existing) {
      return c.json({ error: "Este e-mail j\xE1 est\xE1 em uso por outro usu\xE1rio" }, 409);
    }
  }
  await db.prepare(`
    UPDATE users 
    SET full_name = ?, company_name = ?, email = ?, avatar_url = ?
    WHERE id = ?
  `).bind(fullName, companyName, email, avatarUrl, user.id).run();
  const updatedUser = await db.prepare(`
    SELECT id, email, full_name, company_name, plan, api_token, avatar_url, created_at
    FROM users WHERE id = ?
  `).bind(user.id).first();
  return c.json({
    success: true,
    message: "Perfil atualizado com sucesso!",
    user: updatedUser
  });
});
app.put("/api/user/password", async (c) => {
  const db = c.env.DB;
  if (!db)
    return c.json({ error: "DB n\xE3o configurado" }, 500);
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autenticado" }, 401);
  }
  const body = await c.req.json();
  const currentPassword = body.current_password || "";
  const newPassword = body.new_password || "";
  if (!currentPassword || !newPassword) {
    return c.json({ error: "Informe a senha atual e a nova senha" }, 400);
  }
  if (newPassword.length < 6) {
    return c.json({ error: "A nova senha deve ter no m\xEDnimo 6 caracteres" }, 400);
  }
  const dbUser = await db.prepare("SELECT password_hash FROM users WHERE id = ?").bind(user.id).first();
  const currentHash = await hashPassword(currentPassword);
  if (!dbUser || dbUser.password_hash !== currentHash) {
    return c.json({ error: "Senha atual incorreta" }, 400);
  }
  const newHash = await hashPassword(newPassword);
  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(newHash, user.id).run();
  return c.json({
    success: true,
    message: "Senha alterada com sucesso!"
  });
});
app.post("/api/user/regenerate-token", async (c) => {
  const db = c.env.DB;
  if (!db)
    return c.json({ error: "DB n\xE3o configurado" }, 500);
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autenticado" }, 401);
  }
  const newToken = generateToken("inf_live");
  await db.prepare("UPDATE users SET api_token = ? WHERE id = ?").bind(newToken, user.id).run();
  return c.json({
    success: true,
    api_token: newToken,
    message: "Novo Token de API gerado com sucesso!"
  });
});
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    service: "Innflu Cloudflare API",
    version: "1.1.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/stats", async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: "Database binding n\xE3o configurado" }, 500);
  }
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  try {
    const totalLeadsRes = await db.prepare("SELECT count(*) as count FROM leads WHERE user_id = ?").bind(userId).first();
    const pendingLeadsRes = await db.prepare("SELECT count(*) as count FROM leads WHERE user_id = ? AND status IN ('pending', 'minerada')").bind(userId).first();
    const sentTodayRes = await db.prepare(
      "SELECT count(*) as count FROM sent_logs WHERE user_id = ? AND date(sent_at) = date('now') AND status = 'success'"
    ).bind(userId).first();
    const totalSentRes = await db.prepare("SELECT count(*) as count FROM sent_logs WHERE user_id = ? AND status = 'success'").bind(userId).first();
    const withWhatsappRes = await db.prepare("SELECT count(*) as count FROM leads WHERE user_id = ? AND whatsapp IS NOT NULL AND whatsapp != ''").bind(userId).first();
    const withEmailRes = await db.prepare("SELECT count(*) as count FROM leads WHERE user_id = ? AND email IS NOT NULL AND email != ''").bind(userId).first();
    return c.json({
      totalLeads: totalLeadsRes?.count || 0,
      pendingLeads: pendingLeadsRes?.count || 0,
      sentToday: sentTodayRes?.count || 0,
      totalSent: totalSentRes?.count || 0,
      withWhatsapp: withWhatsappRes?.count || 0,
      withEmail: withEmailRes?.count || 0,
      dailyLimit: 40,
      userId
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});
app.get("/api/campaigns", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const { results } = await db.prepare("SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all();
  return c.json({ campaigns: results });
});
app.post("/api/campaigns", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();
  const id = body.id || "camp_" + Date.now();
  const name = body.name || "Nova Campanha";
  const keyword = body.keyword || "maternidade";
  const targetGender = body.target_gender || "female";
  const minFollowers = Number(body.min_followers || 1e4);
  const maxFollowers = Number(body.max_followers || 1e7);
  const requireActiveStories = body.require_active_stories ? 1 : 0;
  const dailyLimit = Number(body.daily_limit || 40);
  const minDelaySec = Number(body.min_delay_sec || 60);
  const maxDelaySec = Number(body.max_delay_sec || 180);
  await db.prepare(`
    INSERT INTO campaigns (id, user_id, name, keyword, target_gender, min_followers, max_followers, require_active_stories, daily_limit, min_delay_sec, max_delay_sec, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).bind(id, userId, name, keyword, targetGender, minFollowers, maxFollowers, requireActiveStories, dailyLimit, minDelaySec, maxDelaySec).run();
  return c.json({ success: true, id });
});
app.get("/api/templates", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const { results } = await db.prepare("SELECT * FROM templates WHERE user_id = ? AND is_active = 1 ORDER BY id ASC").bind(userId).all();
  return c.json({ templates: results, userId });
});
app.post("/api/templates", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();
  if (Array.isArray(body.templates)) {
    for (const t of body.templates) {
      const id2 = t.id || "tmpl_" + Math.random().toString(36).substring(2, 9);
      const title2 = t.title || "Modelo de Mensagem";
      const content2 = t.content || "";
      await db.prepare(`
        INSERT INTO templates (id, user_id, campaign_id, title, content, is_active)
        VALUES (?, ?, NULL, ?, ?, 1)
        ON CONFLICT(id) DO UPDATE SET title = excluded.title, content = excluded.content
      `).bind(id2, userId, title2, content2).run();
    }
    return c.json({ success: true, count: body.templates.length, userId });
  }
  const id = body.id || "tmpl_" + Date.now();
  const campaignId = body.campaign_id || null;
  const title = body.title || "Novo Modelo";
  const content = body.content || "";
  await db.prepare(`
    INSERT INTO templates (id, user_id, campaign_id, title, content, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, content = excluded.content
  `).bind(id, userId, campaignId, title, content).run();
  return c.json({ success: true, id, userId });
});
app.get("/api/leads", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const status = c.req.query("status");
  const niche = c.req.query("niche");
  let query = "SELECT * FROM leads WHERE user_id = ?";
  const params = [userId];
  if (status && status !== "all") {
    query += " AND status = ?";
    params.push(status);
  }
  if (niche && niche !== "all") {
    query += " AND niche LIKE ?";
    params.push(`%${niche}%`);
  }
  query += " ORDER BY discovered_at DESC LIMIT 300";
  const stmt = db.prepare(query);
  const { results } = await stmt.bind(...params).all();
  return c.json({ leads: results, userId });
});
app.post("/api/leads", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();
  const username = (body.username || "").replace("@", "").trim().toLowerCase();
  if (!username) {
    return c.json({ error: "Username obrigat\xF3rio" }, 400);
  }
  const isBlacklisted = await db.prepare("SELECT id FROM blacklist WHERE user_id = ? AND username = ?").bind(userId, username).first();
  if (isBlacklisted) {
    return c.json({ error: "Perfil est\xE1 na blacklist", blacklisted: true }, 400);
  }
  const id = "lead_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const campaignId = body.campaign_id || null;
  const fullName = body.full_name || "";
  const followersCount = Number(body.followers_count || 0);
  const detectedGender = body.detected_gender || "unknown";
  const hasActiveStories = body.has_active_stories ? 1 : 0;
  const whatsapp = body.whatsapp || null;
  const email = body.email || null;
  const bio = body.bio || "";
  const niche = body.niche || "Geral";
  const status = body.status || "minerada";
  try {
    await db.prepare(`
      INSERT INTO leads (id, user_id, campaign_id, username, full_name, followers_count, detected_gender, has_active_stories, whatsapp, email, bio, niche, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, username) DO UPDATE SET
        followers_count = excluded.followers_count,
        has_active_stories = excluded.has_active_stories,
        whatsapp = COALESCE(excluded.whatsapp, leads.whatsapp),
        email = COALESCE(excluded.email, leads.email),
        bio = excluded.bio,
        niche = COALESCE(excluded.niche, leads.niche),
        status = CASE WHEN leads.status = 'sent' THEN 'sent' ELSE excluded.status END
    `).bind(id, userId, campaignId, username, fullName, followersCount, detectedGender, hasActiveStories, whatsapp, email, bio, niche, status).run();
    return c.json({ success: true, username, niche, userId });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});
app.post("/api/leads/import", async (c) => {
  const db = c.env.DB;
  if (!db)
    return c.json({ error: "DB n\xE3o configurado" }, 500);
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  try {
    const body = await c.req.json();
    const leads = Array.isArray(body) ? body : body.leads || [];
    if (!leads || leads.length === 0) {
      return c.json({ error: "Nenhum lead fornecido para importa\xE7\xE3o" }, 400);
    }
    const blacklistRows = await db.prepare("SELECT username FROM blacklist WHERE user_id = ?").bind(userId).all();
    const blacklistedSet = new Set((blacklistRows.results || []).map((r) => (r.username || "").toLowerCase()));
    let imported = 0;
    let skipped = 0;
    const batchSize = 50;
    for (let i = 0; i < leads.length; i += batchSize) {
      const chunk = leads.slice(i, i + batchSize);
      const statements = [];
      for (const lead of chunk) {
        const username = (lead.username || "").replace("@", "").trim().toLowerCase();
        if (!username || blacklistedSet.has(username)) {
          skipped++;
          continue;
        }
        const id = lead.id || "lead_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
        const campaignId = lead.campaign_id || null;
        const fullName = (lead.full_name || lead.name || "").trim();
        const followersCount = Number(lead.followers_count || 0);
        const detectedGender = lead.detected_gender || "unknown";
        const hasActiveStories = lead.has_active_stories === 1 || lead.has_active_stories === true || String(lead.has_active_stories).toLowerCase() === "sim" ? 1 : 0;
        const whatsapp = lead.whatsapp ? String(lead.whatsapp).trim() : null;
        const email = lead.email ? String(lead.email).trim() : null;
        const bio = lead.bio ? String(lead.bio).trim() : "";
        const niche = lead.niche ? String(lead.niche).trim() : "Geral";
        const status = lead.status || "minerada";
        const discoveredAt = lead.discovered_at || (/* @__PURE__ */ new Date()).toISOString();
        statements.push(db.prepare(`
          INSERT INTO leads (id, user_id, campaign_id, username, full_name, followers_count, detected_gender, has_active_stories, whatsapp, email, bio, niche, status, discovered_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, username) DO UPDATE SET
            full_name = CASE WHEN excluded.full_name != '' THEN excluded.full_name ELSE leads.full_name END,
            followers_count = CASE WHEN excluded.followers_count > 0 THEN excluded.followers_count ELSE leads.followers_count END,
            has_active_stories = excluded.has_active_stories,
            whatsapp = COALESCE(excluded.whatsapp, leads.whatsapp),
            email = COALESCE(excluded.email, leads.email),
            bio = CASE WHEN excluded.bio != '' THEN excluded.bio ELSE leads.bio END,
            niche = COALESCE(excluded.niche, leads.niche),
            status = CASE WHEN leads.status = 'sent' THEN 'sent' ELSE excluded.status END
        `).bind(id, userId, campaignId, username, fullName, followersCount, detectedGender, hasActiveStories, whatsapp, email, bio, niche, status, discoveredAt));
      }
      if (statements.length > 0) {
        await db.batch(statements);
        imported += statements.length;
      }
    }
    return c.json({
      success: true,
      message: `${imported} influenciadoras importadas com sucesso!`,
      imported,
      skipped,
      total: leads.length,
      userId
    });
  } catch (err) {
    return c.json({ error: "Erro ao importar leads: " + err.message }, 500);
  }
});
app.post("/api/check-lead", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();
  const username = (body.username || "").replace("@", "").trim().toLowerCase();
  if (!username) {
    return c.json({ eligible: false, reason: "Username inv\xE1lido" });
  }
  const isBlacklisted = await db.prepare("SELECT id FROM blacklist WHERE user_id = ? AND username = ?").bind(userId, username).first();
  if (isBlacklisted) {
    return c.json({ eligible: false, reason: "blacklisted" });
  }
  const lastSent = await db.prepare(`
    SELECT id, sent_at, 
      (julianday('now') - julianday(sent_at)) as days_ago
    FROM sent_logs 
    WHERE user_id = ? AND username = ? AND status = 'success'
    ORDER BY sent_at DESC LIMIT 1
  `).bind(userId, username).first();
  if (lastSent) {
    const daysAgo = Math.floor(lastSent.days_ago || 0);
    if (daysAgo < 7) {
      return c.json({
        eligible: false,
        reason: "contacted_recently",
        daysAgo,
        sent_at: lastSent.sent_at,
        message: `J\xE1 recebeu mensagem h\xE1 ${daysAgo} dia(s). S\xF3 poder\xE1 ser chamada ap\xF3s 7 dias.`
      });
    } else {
      return c.json({
        eligible: true,
        reason: "follow_up_eligible",
        daysAgo,
        sent_at: lastSent.sent_at
      });
    }
  }
  return c.json({ eligible: true, reason: "never_contacted" });
});
app.post("/api/log-sent", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();
  const username = (body.username || "").replace("@", "").trim().toLowerCase();
  const messageText = body.message_text || "";
  const campaignId = body.campaign_id || null;
  const status = body.status || "success";
  const errorMessage = body.error_message || null;
  const logId = "log_" + Date.now();
  try {
    await db.prepare(`
      INSERT INTO sent_logs (id, user_id, campaign_id, username, message_text, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(logId, userId, campaignId, username, messageText, status, errorMessage).run();
    if (status === "success") {
      await db.prepare(`
        UPDATE leads SET status = 'sent', last_contacted_at = CURRENT_TIMESTAMP WHERE user_id = ? AND username = ?
      `).bind(userId, username).run();
    }
    return c.json({ success: true, logId });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});
app.get("/api/blacklist", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const { results } = await db.prepare("SELECT * FROM blacklist WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all();
  return c.json({ blacklist: results, userId });
});
app.post("/api/blacklist", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();
  const username = (body.username || "").replace("@", "").trim().toLowerCase();
  const reason = body.reason || null;
  if (!username) {
    return c.json({ error: "Username obrigat\xF3rio" }, 400);
  }
  const id = "blk_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
  await db.prepare(`
    INSERT INTO blacklist (id, user_id, username, reason) VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, username) DO UPDATE SET reason = excluded.reason
  `).bind(id, userId, username, reason).run();
  await db.prepare("UPDATE leads SET status = 'blacklisted' WHERE user_id = ? AND username = ?").bind(userId, username).run();
  return c.json({ success: true, username, reason, userId });
});
app.post("/api/blacklist/bulk", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();
  const usernames = body.usernames || [];
  const reason = body.reason || null;
  if (!usernames || !usernames.length) {
    return c.json({ error: "Nenhum usu\xE1rio informado" }, 400);
  }
  const statements = [];
  for (const rawUser of usernames) {
    const username = (rawUser || "").replace("@", "").trim().toLowerCase();
    if (!username)
      continue;
    const id = "blk_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    statements.push(
      db.prepare(`
        INSERT INTO blacklist (id, user_id, username, reason) VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, username) DO UPDATE SET reason = COALESCE(excluded.reason, blacklist.reason)
      `).bind(id, userId, username, reason)
    );
    statements.push(
      db.prepare("UPDATE leads SET status = 'blacklisted' WHERE user_id = ? AND username = ?").bind(userId, username)
    );
  }
  if (statements.length > 0) {
    await db.batch(statements);
  }
  return c.json({ success: true, count: usernames.length, reason, userId });
});
app.delete("/api/blacklist/:username", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const username = c.req.param("username").replace("@", "").trim().toLowerCase();
  await db.prepare("DELETE FROM blacklist WHERE user_id = ? AND username = ?").bind(userId, username).run();
  await db.prepare("UPDATE leads SET status = 'minerada' WHERE user_id = ? AND username = ? AND status = 'blacklisted'").bind(userId, username).run();
  return c.json({ success: true, username, userId });
});
app.get("/api/logs", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const limit = Number(c.req.query("limit") || 100);
  const { results } = await db.prepare("SELECT * FROM sent_logs WHERE user_id = ? ORDER BY sent_at DESC LIMIT ?").bind(userId, limit).all();
  return c.json({ logs: results });
});
app.get("/api/analytics", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  try {
    const byStatus = await db.prepare("SELECT status, count(*) as count FROM leads WHERE user_id = ? GROUP BY status").bind(userId).all();
    const last7Days = await db.prepare(`
      SELECT date(sent_at) as date, count(*) as count
      FROM sent_logs
      WHERE user_id = ? AND sent_at >= date('now', '-7 days')
      GROUP BY date(sent_at)
      ORDER BY date(sent_at) ASC
    `).bind(userId).all();
    const totalLeads = (await db.prepare("SELECT count(*) as c FROM leads WHERE user_id = ?").bind(userId).first())?.c || 0;
    const withWhatsapp = (await db.prepare("SELECT count(*) as c FROM leads WHERE user_id = ? AND whatsapp IS NOT NULL AND whatsapp != ''").bind(userId).first())?.c || 0;
    const withEmail = (await db.prepare("SELECT count(*) as c FROM leads WHERE user_id = ? AND email IS NOT NULL AND email != ''").bind(userId).first())?.c || 0;
    const withBoth = (await db.prepare("SELECT count(*) as c FROM leads WHERE user_id = ? AND whatsapp IS NOT NULL AND whatsapp != '' AND email IS NOT NULL AND email != ''").bind(userId).first())?.c || 0;
    return c.json({
      totalLeads,
      channels: {
        whatsapp: withWhatsapp,
        email: withEmail,
        both: withBoth,
        onlyDirect: totalLeads - (withWhatsapp + withEmail - withBoth)
      },
      byStatus: byStatus.results || [],
      last7Days: last7Days.results || []
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});
app.post("/api/qualify", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  try {
    const body = await c.req.json();
    const fullName = body.full_name || "";
    const bio = body.bio || "";
    const niche = body.niche || "maternidade";
    const result = await analyzeProfileWithAI(c.env.AI, fullName, bio, niche);
    return c.json({ result });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});
app.delete("/api/leads/:id", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const id = c.req.param("id");
  await db.prepare("DELETE FROM leads WHERE user_id = ? AND (id = ? OR username = ?)").bind(userId, id, id).run();
  return c.json({ success: true });
});
app.post("/api/leads/:id/status", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const id = c.req.param("id");
  const body = await c.req.json();
  const status = body.status || "minerada";
  await db.prepare("UPDATE leads SET status = ? WHERE user_id = ? AND (id = ? OR username = ?)").bind(status, userId, id, id).run();
  return c.json({ success: true, status });
});
app.post("/api/leads/bulk-status", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();
  const ids = body.ids || [];
  const status = body.status || "partner";
  if (!ids || !ids.length) {
    return c.json({ error: "Nenhum lead informado" }, 400);
  }
  const statements = ids.map(
    (id) => db.prepare("UPDATE leads SET status = ? WHERE user_id = ? AND (id = ? OR username = ?)").bind(status, userId, id, id)
  );
  await db.batch(statements);
  return c.json({ success: true, count: ids.length, status, userId });
});
app.post("/api/leads/bulk-delete", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();
  const ids = body.ids || [];
  if (!ids || !ids.length) {
    return c.json({ error: "Nenhum lead informado" }, 400);
  }
  const statements = ids.map(
    (id) => db.prepare("DELETE FROM leads WHERE user_id = ? AND (id = ? OR username = ?)").bind(userId, id, id)
  );
  await db.batch(statements);
  return c.json({ success: true, count: ids.length, userId });
});
app.get("/api/settings", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const { results } = await db.prepare("SELECT * FROM settings").all();
  const settingsObj = {};
  results.forEach((row) => {
    settingsObj[row.key] = row.value;
  });
  return c.json({ settings: settingsObj });
});
app.put("/api/settings", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const body = await c.req.json();
  for (const [key, val] of Object.entries(body)) {
    await db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).bind(key, String(val)).run();
  }
  return c.json({ success: true, settings: body });
});
app.post("/api/settings", async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: "N\xE3o autorizado. Login e senha obrigat\xF3rios.", authenticated: false }, 401);
  }
  const body = await c.req.json();
  for (const [key, val] of Object.entries(body)) {
    await db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).bind(key, String(val)).run();
  }
  return c.json({ success: true, settings: body });
});
app.notFound(async (c) => {
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text("Not Found", 404);
});
app.onError((err, c) => {
  console.error("Unhandled Server Error:", err);
  return c.json({ error: "Erro no servidor: " + (err.message || "Desconhecido") }, 500);
});
var src_default = app;
export {
  src_default as default
};
