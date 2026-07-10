import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { hasInjectionContext, getCurrentInstance, useSSRContext, createApp, defineComponent, ref, computed, watch, mergeProps, provide, onErrorCaptured, onServerPrefetch, unref, createVNode, resolveDynamicComponent, shallowReactive, reactive, effectScope, inject, defineAsyncComponent, getCurrentScope, toRef, h, isReadonly, isRef, isShallow, isReactive, toRaw } from 'vue';
import { p as parseURL, e as encodePath, k as decodePath, l as hasProtocol, m as isScriptProtocol, n as joinURL, w as withQuery, o as sanitizeStatusCode, q as getContext, $ as $fetch$1, t as createHooks, c as createError$1, v as isEqual, x as stringifyParsedURL, y as stringifyQuery, z as parseQuery, A as defu } from '../nitro/nitro.mjs';
import { b as baseURL } from '../routes/renderer.mjs';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrRenderList, ssrRenderAttr, ssrLooseContain, ssrLooseEqual, ssrInterpolate, ssrRenderClass, ssrRenderSuspense, ssrRenderComponent, ssrRenderVNode } from 'vue/server-renderer';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'stream';
import 'events';
import 'http';
import 'crypto';
import 'buffer';
import 'zlib';
import 'https';
import 'net';
import 'tls';
import 'url';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:url';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch$1.create({
    baseURL: baseURL()
  });
}
if (!("global" in globalThis)) {
  globalThis.global = globalThis;
}
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const appId = "nuxt-app";
function getNuxtAppCtx(id = appId) {
  return getContext(id, {
    asyncContext: false
  });
}
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    _id: options.id || appId || "nuxt-app",
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.21.8";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: shallowReactive({
      ...options.ssrContext?.payload || {},
      data: shallowReactive({}),
      state: reactive({}),
      once: /* @__PURE__ */ new Set(),
      _errors: shallowReactive({})
    }),
    static: {
      data: {}
    },
    runWithContext(fn) {
      if (nuxtApp._scope.active && !getCurrentScope()) {
        return nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn));
      }
      return callWithNuxt(nuxtApp, fn);
    },
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: shallowReactive({}),
    _payloadRevivers: {},
    ...options
  };
  {
    nuxtApp.payload.serverRendered = true;
  }
  if (nuxtApp.ssrContext) {
    nuxtApp.payload.path = nuxtApp.ssrContext.url;
    nuxtApp.ssrContext.nuxt = nuxtApp;
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: nuxtApp.ssrContext.runtimeConfig.public,
      app: nuxtApp.ssrContext.runtimeConfig.app
    };
  }
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
function registerPluginHooks(nuxtApp, plugin) {
  if (plugin.hooks) {
    nuxtApp.hooks.addHooks(plugin.hooks);
  }
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  const resolvedPlugins = /* @__PURE__ */ new Set();
  const unresolvedPlugins = [];
  const parallels = [];
  let error = void 0;
  let promiseDepth = 0;
  async function executePlugin(plugin) {
    const unresolvedPluginsForThisPlugin = plugin.dependsOn?.filter((name) => plugins2.some((p) => p._name === name) && !resolvedPlugins.has(name)) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin).then(async () => {
        if (plugin._name) {
          resolvedPlugins.add(plugin._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin._name)) {
              dependsOn.delete(plugin._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      }).catch((e) => {
        if (!plugin.parallel && !nuxtApp.payload.error) {
          throw e;
        }
        error ||= e;
      });
      if (plugin.parallel) {
        parallels.push(promise);
      } else {
        await promise;
      }
    }
  }
  for (const plugin of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin.env?.islands === false) {
      continue;
    }
    registerPluginHooks(nuxtApp, plugin);
  }
  for (const plugin of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin.env?.islands === false) {
      continue;
    }
    await executePlugin(plugin);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (error) {
    throw nuxtApp.payload.error || error;
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin) {
  if (typeof plugin === "function") {
    return plugin;
  }
  const _name = plugin._name || plugin.name;
  delete plugin.name;
  return Object.assign(plugin.setup || (() => {
  }), plugin, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => setup();
  const nuxtAppCtx = getNuxtAppCtx(nuxt._id);
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
function tryUseNuxtApp(id) {
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = getCurrentInstance()?.appContext.app.$nuxt;
  }
  nuxtAppInstance ||= getNuxtAppCtx(id).tryUse();
  return nuxtAppInstance || null;
}
function useNuxtApp(id) {
  const nuxtAppInstance = tryUseNuxtApp(id);
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const PageRouteSymbol = /* @__PURE__ */ Symbol("route");
globalThis._importMeta_.url.replace(/\/app\/.*$/, "/");
const useRouter = () => {
  return useNuxtApp()?.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};
const HTML_ATTR_UNSAFE_RE = /[&"'<>]/g;
const HTML_ATTR_ENCODE_MAP = {
  "&": "%26",
  '"': "%22",
  "'": "%27",
  "<": "%3C",
  ">": "%3E"
};
function encodeForHtmlAttr(value) {
  return value.replace(HTML_ATTR_UNSAFE_RE, (c) => HTML_ATTR_ENCODE_MAP[c]);
}
const navigateTo = (to, options) => {
  to ||= "/";
  const toPath = typeof to === "string" ? to : "path" in to ? resolveRouteObject(to) : useRouter().resolve(to).href;
  const isExternalHost = hasProtocol(toPath, { acceptRelative: true });
  const isExternal = options?.external || isExternalHost;
  if (isExternal) {
    if (!options?.external) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const { protocol } = new URL(toPath, "http://localhost");
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedHeader = encodeURL(location2, isExternalHost);
        const encodedLoc = encodeForHtmlAttr(encodedHeader);
        nuxtApp.ssrContext["~renderResponse"] = {
          statusCode: sanitizeStatusCode(options?.redirectCode || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: encodedHeader }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options?.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  const encodedTo = typeof to === "string" ? encodeRoutePath(to) : to;
  return options?.replace ? router.replace(encodedTo) : router.push(encodedTo);
};
function resolveRouteObject(to) {
  return withQuery(to.path || "", to.query || {}) + (to.hash || "");
}
function encodeURL(location2, isExternalHost = false) {
  const url = new URL(location2, "http://localhost");
  if (!isExternalHost) {
    const pathname = url.pathname.replace(/^\/{2,}/, "/");
    return pathname + url.search + url.hash;
  }
  if (location2.startsWith("//")) {
    return url.toString().replace(url.protocol, "");
  }
  return url.toString();
}
function encodeRoutePath(url) {
  const parsed = parseURL(url);
  return encodePath(decodePath(parsed.pathname)) + parsed.search + parsed.hash;
}
const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = /* @__NO_SIDE_EFFECTS__ */ () => toRef(useNuxtApp().payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const error2 = /* @__PURE__ */ useError();
    if (false) ;
    error2.value ||= nuxtError;
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  if (typeof error !== "string" && error.statusText) {
    error.message ??= error.statusText;
  }
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  Object.defineProperty(nuxtError, "status", {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    get: () => nuxtError.statusCode,
    configurable: true
  });
  Object.defineProperty(nuxtError, "statusText", {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    get: () => nuxtError.statusMessage,
    configurable: true
  });
  return nuxtError;
};
function freezeHead(head) {
  const realPush = head.push;
  head.push = () => ({ dispose: () => {
  }, patch: () => {
  }, _poll: () => {
  } });
  return () => {
    head.push = realPush;
  };
}
const unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    if (nuxtApp.ssrContext.islandContext) {
      const unfreeze = freezeHead(head);
      nuxtApp.hooks.hookOnce("app:created", unfreeze);
    }
    nuxtApp.vueApp.use(head);
  }
});
const matcher = (m, p) => {
  return [];
};
const _routeRulesMatcher = (path) => defu({}, ...matcher("", typeof path === "string" ? path.toLowerCase() : path).map((r) => r.data).reverse());
const routeRulesMatcher = _routeRulesMatcher;
function getRouteRules(arg) {
  const path = typeof arg === "string" ? arg : arg.path;
  try {
    return routeRulesMatcher(path.toLowerCase());
  } catch (e) {
    console.error("[nuxt] Error matching route rules.", e);
    return {};
  }
}
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware((to) => {
  {
    return;
  }
});
const globalMiddleware = [
  manifest_45route_45rule
];
function getRouteFromPath(fullPath) {
  const route = fullPath && typeof fullPath === "object" ? fullPath : {};
  if (typeof fullPath === "object") {
    fullPath = stringifyParsedURL({
      pathname: fullPath.path || "",
      search: stringifyQuery(fullPath.query || {}),
      hash: fullPath.hash || ""
    });
  }
  const url = new URL(fullPath.toString(), "http://localhost");
  return {
    path: url.pathname,
    fullPath,
    query: parseQuery(url.search),
    hash: url.hash,
    // stub properties for compat with vue-router
    params: route.params || {},
    name: void 0,
    matched: route.matched || [],
    redirectedFrom: void 0,
    meta: route.meta || {},
    href: fullPath
  };
}
const router_DclsWNDeVV7SyG4lslgLnjbQUK1ws8wgf2FHaAbo7Cw = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  setup(nuxtApp) {
    const initialURL = nuxtApp.ssrContext.url;
    const routes = [];
    const hooks = {
      "navigate:before": [],
      "resolve:before": [],
      "navigate:after": [],
      "error": []
    };
    const registerHook = (hook, guard) => {
      hooks[hook].push(guard);
      return () => hooks[hook].splice(hooks[hook].indexOf(guard), 1);
    };
    (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    const route = reactive(getRouteFromPath(initialURL));
    async function handleNavigation(url, replace) {
      try {
        const to = getRouteFromPath(url);
        for (const middleware of hooks["navigate:before"]) {
          const result = await middleware(to, route);
          if (result === false || result instanceof Error) {
            return;
          }
          if (typeof result === "string" && result.length) {
            return await handleNavigation(result, true);
          }
        }
        for (const handler of hooks["resolve:before"]) {
          await handler(to, route);
        }
        Object.assign(route, to);
        if (false) ;
        for (const middleware of hooks["navigate:after"]) {
          await middleware(to, route);
        }
      } catch (err) {
        for (const handler of hooks.error) {
          await handler(err);
        }
      }
    }
    const currentRoute = computed(() => route);
    const router = {
      currentRoute,
      isReady: () => Promise.resolve(),
      // These options provide a similar API to vue-router but have no effect
      options: {},
      install: () => Promise.resolve(),
      // Navigation
      push: (url) => handleNavigation(url),
      replace: (url) => handleNavigation(url),
      back: () => (void 0).history.go(-1),
      go: (delta) => (void 0).history.go(delta),
      forward: () => (void 0).history.go(1),
      // Guards
      beforeResolve: (guard) => registerHook("resolve:before", guard),
      beforeEach: (guard) => registerHook("navigate:before", guard),
      afterEach: (guard) => registerHook("navigate:after", guard),
      onError: (handler) => registerHook("error", handler),
      // Routes
      resolve: getRouteFromPath,
      addRoute: (parentName, route2) => {
        routes.push(route2);
      },
      getRoutes: () => routes,
      hasRoute: (name) => routes.some((route2) => route2.name === name),
      removeRoute: (name) => {
        const index = routes.findIndex((route2) => route2.name === name);
        if (index !== -1) {
          routes.splice(index, 1);
        }
      }
    };
    nuxtApp.vueApp.component("RouterLink", defineComponent({
      functional: true,
      props: {
        to: {
          type: String,
          required: true
        },
        custom: Boolean,
        replace: Boolean,
        // Not implemented
        activeClass: String,
        exactActiveClass: String,
        ariaCurrentValue: String
      },
      setup: (props, { slots }) => {
        const navigate = () => handleNavigation(props.to, props.replace);
        return () => {
          const route2 = router.resolve(props.to);
          return props.custom ? slots.default?.({ href: props.to, navigate, route: route2 }) : h("a", { href: props.to, onClick: (e) => {
            e.preventDefault();
            return navigate();
          } }, slots);
        };
      }
    }));
    nuxtApp._route = route;
    nuxtApp._middleware ||= {
      global: [],
      named: {}
    };
    const initialLayout = nuxtApp.payload.state._layout;
    const initialLayoutProps = nuxtApp.payload.state._layoutProps;
    nuxtApp.hooks.hookOnce("app:created", async () => {
      router.beforeEach(async (to, from) => {
        to.meta = reactive(to.meta || {});
        if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
          to.meta.layout = initialLayout;
          to.meta.layoutProps = initialLayoutProps;
        }
        nuxtApp._processingMiddleware = true;
        if (!nuxtApp.ssrContext?.islandContext) {
          const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
          const routeRules = getRouteRules({ path: to.path });
          if (routeRules.appMiddleware) {
            for (const key in routeRules.appMiddleware) {
              const guard = nuxtApp._middleware.named[key];
              if (!guard) {
                continue;
              }
              if (routeRules.appMiddleware[key]) {
                middlewareEntries.add(guard);
              } else {
                middlewareEntries.delete(guard);
              }
            }
          }
          for (const middleware of middlewareEntries) {
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            {
              if (result === false || result instanceof Error) {
                const error = result || createError$1({
                  status: 404,
                  statusText: `Page Not Found: ${initialURL}`,
                  data: {
                    path: initialURL
                  }
                });
                delete nuxtApp._processingMiddleware;
                return nuxtApp.runWithContext(() => showError(error));
              }
            }
            if (result === true) {
              continue;
            }
            if (result || result === false) {
              return result;
            }
          }
        }
      });
      router.afterEach(() => {
        delete nuxtApp._processingMiddleware;
      });
      await router.replace(initialURL);
      if (!isEqual(route.fullPath, initialURL)) {
        await nuxtApp.runWithContext(() => navigateTo(route.fullPath));
      }
    });
    return {
      provide: {
        route,
        router
      }
    };
  }
});
function definePayloadReducer(name, reduce) {
  {
    useNuxtApp().ssrContext["~payloadReducers"][name] = reduce;
  }
}
const reducers = [
  ["NuxtError", (data) => isNuxtError(data) && data.toJSON()],
  ["EmptyShallowRef", (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["EmptyRef", (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["ShallowRef", (data) => isRef(data) && isShallow(data) && data.value],
  ["ShallowReactive", (data) => isReactive(data) && isShallow(data) && toRaw(data)],
  ["Ref", (data) => isRef(data) && data.value],
  ["Reactive", (data) => isReactive(data) && toRaw(data)]
];
const revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const [reducer, fn] of reducers) {
      definePayloadReducer(reducer, fn);
    }
  }
});
const components_plugin_z4hgvsiddfKkfXTP6M8M4zG5Cb7sGnDhcryKVM45Di4 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
const plugins = [
  unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU,
  router_DclsWNDeVV7SyG4lslgLnjbQUK1ws8wgf2FHaAbo7Cw,
  revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms,
  components_plugin_z4hgvsiddfKkfXTP6M8M4zG5Cb7sGnDhcryKVM45Di4
];
const MODEL_CATEGORIES = {
  thinking: { label: "Thinking / Reasoning", icon: "🧠", description: "Ragionamento avanzato (CoT)" },
  fast: { label: "Fast / Chat", icon: "⚡", description: "Veloce e low-cost" },
  code: { label: "Code", icon: "💻", description: "Ottimizzato per codice" },
  vision: { label: "Vision", icon: "👁️", description: "Multimodale con immagini" }
};
const LLM_MODELS = [
  // ── OpenAI ──────────────────────────────────────
  { id: "o3", name: "o3", provider: "openai", category: "thinking" },
  { id: "o4-mini", name: "o4-mini", provider: "openai", category: "thinking" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai", category: "code" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "openai", category: "fast" },
  { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", provider: "openai", category: "fast" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", category: "vision" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", category: "fast" },
  // ── Anthropic ───────────────────────────────────
  { id: "claude-opus-4", name: "Claude Opus 4", provider: "anthropic", category: "thinking" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "anthropic", category: "code" },
  { id: "claude-3.5-haiku", name: "Claude 3.5 Haiku", provider: "anthropic", category: "fast" },
  // ── Google Gemini ───────────────────────────────
  { id: "gemini-3.5-pro", name: "Gemini 3.5 Pro", provider: "gemini", category: "thinking" },
  { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", provider: "gemini", category: "thinking" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "gemini", category: "thinking" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "gemini", category: "fast" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "gemini", category: "fast" },
  // ── Cohere ──────────────────────────────────────
  { id: "command-r-plus", name: "Command R+", provider: "cohere", category: "thinking" },
  { id: "command-r", name: "Command R", provider: "cohere", category: "fast" },
  { id: "command-a", name: "Command A", provider: "cohere", category: "code" },
  // ── Meta ────────────────────────────────────────
  { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Llama 3.3 70B", provider: "meta", category: "thinking" },
  // ── Mistral ─────────────────────────────────────
  { id: "mistral-large-latest", name: "Mistral Large", provider: "mistral", category: "thinking" },
  { id: "codestral-latest", name: "Codestral", provider: "mistral", category: "code" },
  // ── DeepSeek ────────────────────────────────────
  { id: "deepseek-v4", name: "DeepSeek V4", provider: "deepseek", category: "thinking" },
  { id: "deepseek-chat", name: "DeepSeek V3", provider: "deepseek", category: "fast" },
  { id: "deepseek-reasoner", name: "DeepSeek R1", provider: "deepseek", category: "thinking" }
];
function getModelsGroupedByCategory(provider, dynamicModels) {
  const source = dynamicModels && dynamicModels.length > 0 ? dynamicModels : LLM_MODELS;
  const providerModels = source.filter((m) => m.provider === provider);
  const groups = [];
  for (const [cat, meta] of Object.entries(MODEL_CATEGORIES)) {
    const models = providerModels.filter((m) => m.category === cat);
    if (models.length > 0) {
      groups.push({ category: cat, label: meta.label, icon: meta.icon, models });
    }
  }
  return groups;
}
function getProviders(dynamicModels) {
  const source = dynamicModels && dynamicModels.length > 0 ? dynamicModels : LLM_MODELS;
  return [...new Set(source.map((m) => m.provider))].sort();
}
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    const apiKey = ref("");
    const selectedProvider = ref("openai");
    const selectedModel = ref("gpt-4o-mini");
    const customModelId = ref("");
    const customBaseUrl = ref("");
    const dynamicModels = ref([]);
    const catalogLoading = ref(false);
    const activeMcpServers = ref(["npx -y @modelcontextprotocol/server-everything"]);
    const input = ref("");
    const messages = ref([]);
    const loading = ref(false);
    const dynamicProviders = computed(() => getProviders(dynamicModels.value));
    const modelGroups = computed(() => getModelsGroupedByCategory(selectedProvider.value, dynamicModels.value));
    const knownModelIds = computed(() => modelGroups.value.flatMap((g) => g.models).map((m) => m.id));
    const isCustomModel = computed(() => {
      return selectedModel.value && selectedModel.value !== "__custom__" && !knownModelIds.value.includes(selectedModel.value);
    });
    watch(selectedProvider, (newProv) => {
      if (newProv !== "custom") {
        fetchModelCatalog();
      }
      const models = modelGroups.value.flatMap((g) => g.models);
      if (models.length > 0 && !knownModelIds.value.includes(selectedModel.value)) {
        selectedModel.value = models[0].id;
      }
    });
    async function fetchModelCatalog(force = false) {
      if (catalogLoading.value) return;
      catalogLoading.value = true;
      try {
        const res = await $fetch("/api/models", { query: force ? { force: "1" } : {} });
        if (res && res.data) {
          dynamicModels.value = res.data;
        }
      } catch (e) {
        console.error("Failed to fetch model catalog", e);
      } finally {
        catalogLoading.value = false;
      }
    }
    const mcpCatalog = [
      { name: "Brave Search", cmd: "npx -y @modelcontextprotocol/server-brave-search", desc: "Ricerca Web", icon: "🔍" },
      { name: "GitHub", cmd: "npx -y @modelcontextprotocol/server-github", desc: "Gestione Repository", icon: "🐙" },
      { name: "File System", cmd: "npx -y @modelcontextprotocol/server-filesystem /", desc: "Accesso ai file locali", icon: "📁" },
      { name: "SQLite", cmd: "npx -y @modelcontextprotocol/server-sqlite --db /path/to/db", desc: "Database SQL", icon: "🗄️" },
      { name: "PostgreSQL", cmd: "npx -y @modelcontextprotocol/server-postgres postgres://localhost/db", desc: "Database PostgreSQL", icon: "🐘" },
      { name: "Puppeteer", cmd: "npx -y @modelcontextprotocol/server-puppeteer", desc: "Automazione Browser", icon: "🌐" },
      { name: "Google Drive", cmd: "npx -y @modelcontextprotocol/server-gdrive", desc: "Google Drive API", icon: "📂" },
      { name: "Slack", cmd: "npx -y @modelcontextprotocol/server-slack", desc: "Slack API", icon: "💬" },
      { name: "Notion", cmd: "npx -y @modelcontextprotocol/server-notion", desc: "Notion API", icon: "📝" },
      { name: "Sentry", cmd: "npx -y @modelcontextprotocol/server-sentry", desc: "Sentry Error Tracking", icon: "🐛" },
      { name: "Memory", cmd: "npx -y @modelcontextprotocol/server-memory", desc: "Agent Memory System", icon: "🧠" },
      { name: "Sequential", cmd: "npx -y @modelcontextprotocol/server-sequential-thinking", desc: "Sequential Thinking logic", icon: "⚙️" },
      { name: "Twitter / X", cmd: "npx -y @modelcontextprotocol/server-twitter", desc: "Social Provider API", icon: "🐦" },
      { name: "Facebook", cmd: "npx -y @modelcontextprotocol/server-facebook", desc: "Social Provider API", icon: "📘" }
    ];
    const customCatalog = ref([]);
    const showCustomCatalogForm = ref(false);
    const newCustomMcp = ref({ name: "", icon: "", cmd: "" });
    watch(customCatalog, (val) => {
    }, { deep: true });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col items-center py-10" }, _attrs))}><div class="max-w-3xl w-full px-4 space-y-8"><header><h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> MCP Agent Starter </h1><p class="text-gray-400 mt-2">Chat with an LLM powered by Model Context Protocol (MCP) tools.</p></header><section class="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-6"><div class="space-y-4"><div class="flex justify-between items-center mb-1"><label class="block text-sm font-medium text-gray-300">LLM Provider &amp; Modello</label><div class="flex items-center gap-2">`);
      if (catalogLoading.value) {
        _push(`<span class="text-xs text-gray-400">Caricamento...</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button${ssrIncludeBooleanAttr(catalogLoading.value) ? " disabled" : ""} class="text-xs text-blue-400 hover:text-blue-300">🔄 Aggiorna</button></div></div><div class="grid grid-cols-2 gap-4"><select class="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none capitalize"><!--[-->`);
      ssrRenderList(dynamicProviders.value, (p) => {
        _push(`<option${ssrRenderAttr("value", p)}${ssrIncludeBooleanAttr(Array.isArray(selectedProvider.value) ? ssrLooseContain(selectedProvider.value, p) : ssrLooseEqual(selectedProvider.value, p)) ? " selected" : ""}>${ssrInterpolate(p === "openai" ? "OpenAI" : p)}</option>`);
      });
      _push(`<!--]--><option value="custom"${ssrIncludeBooleanAttr(Array.isArray(selectedProvider.value) ? ssrLooseContain(selectedProvider.value, "custom") : ssrLooseEqual(selectedProvider.value, "custom")) ? " selected" : ""}>Custom (Local/OpenRouter)</option></select><select class="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"><!--[-->`);
      ssrRenderList(modelGroups.value, (group) => {
        _push(`<optgroup${ssrRenderAttr("label", `${group.icon} ${group.label}`)}><!--[-->`);
        ssrRenderList(group.models, (m) => {
          _push(`<option${ssrRenderAttr("value", m.id)}${ssrIncludeBooleanAttr(Array.isArray(selectedModel.value) ? ssrLooseContain(selectedModel.value, m.id) : ssrLooseEqual(selectedModel.value, m.id)) ? " selected" : ""}>${ssrInterpolate(m.name)}</option>`);
        });
        _push(`<!--]--></optgroup>`);
      });
      _push(`<!--]--><optgroup label="✏️ Custom"><option value="__custom__"${ssrIncludeBooleanAttr(Array.isArray(selectedModel.value) ? ssrLooseContain(selectedModel.value, "__custom__") : ssrLooseEqual(selectedModel.value, "__custom__")) ? " selected" : ""}>Inserisci manualmente...</option></optgroup></select></div>`);
      if (selectedModel.value === "__custom__" || isCustomModel.value) {
        _push(`<div class="mt-2"><input${ssrRenderAttr("value", customModelId.value)} type="text" placeholder="es. gpt-4o" class="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"></div>`);
      } else {
        _push(`<!---->`);
      }
      if (selectedProvider.value === "custom") {
        _push(`<div><label class="block text-sm font-medium text-gray-300 mb-1">Base URL (Custom/Local)</label><input${ssrRenderAttr("value", customBaseUrl.value)} type="text" placeholder="http://127.0.0.1:1234/v1" class="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div><label class="block text-sm font-medium text-gray-300 mb-1">API Key <span class="text-gray-500 font-normal">(Opzionale per Localhost)</span></label><input${ssrRenderAttr("value", apiKey.value)} type="password" placeholder="sk-..." class="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"></div></div><div><div class="flex items-center justify-between mb-2"><label class="text-sm font-medium text-gray-300">Server MCP Attivi</label><div class="flex gap-2"><button class="text-xs text-purple-400 hover:text-purple-300">+ Crea Preset</button><button class="text-xs text-blue-400 hover:text-blue-300">+ Aggiungi Manuale</button></div></div>`);
      if (showCustomCatalogForm.value) {
        _push(`<div class="mb-4 p-3 bg-gray-800 border border-gray-700 rounded-lg space-y-2"><h4 class="text-xs font-semibold text-gray-300 mb-2">Nuovo Preset MCP</h4><div class="grid grid-cols-2 gap-2"><input${ssrRenderAttr("value", newCustomMcp.value.name)} type="text" placeholder="Nome (es. Twitter)" class="p-2 bg-gray-950 border border-gray-700 rounded text-xs focus:border-purple-500 outline-none"><input${ssrRenderAttr("value", newCustomMcp.value.icon)} type="text" placeholder="Icona (es. 🐦 o URL immagine)" class="p-2 bg-gray-950 border border-gray-700 rounded text-xs focus:border-purple-500 outline-none"><input${ssrRenderAttr("value", newCustomMcp.value.cmd)} type="text" placeholder="Comando (es. npx -y @modelcontextprotocol/server-twitter)" class="col-span-2 p-2 bg-gray-950 border border-gray-700 rounded text-xs focus:border-purple-500 outline-none font-mono"></div><div class="flex justify-end pt-1"><button${ssrIncludeBooleanAttr(!newCustomMcp.value.name || !newCustomMcp.value.cmd) ? " disabled" : ""} class="text-xs bg-purple-600 text-white px-3 py-1.5 rounded disabled:opacity-50">Salva Preset</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex flex-wrap gap-2 mb-4"><!--[-->`);
      ssrRenderList([...mcpCatalog, ...customCatalog.value], (mcp) => {
        _push(`<button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-800 border border-gray-700 hover:border-blue-500 transition-colors text-xs text-gray-400 hover:text-gray-200"${ssrRenderAttr("title", mcp.desc || "Preset personalizzato")}>`);
        if (mcp.icon && mcp.icon.startsWith("http")) {
          _push(`<img${ssrRenderAttr("src", mcp.icon)} class="w-4 h-4 rounded-sm object-cover">`);
        } else {
          _push(`<span>${ssrInterpolate(mcp.icon)}</span>`);
        }
        _push(`<span>${ssrInterpolate(mcp.name)}</span></button>`);
      });
      _push(`<!--]--></div><div class="space-y-2"><!--[-->`);
      ssrRenderList(activeMcpServers.value, (server, idx) => {
        _push(`<div class="flex gap-2"><input${ssrRenderAttr("value", activeMcpServers.value[idx])} type="text" placeholder="es. npx -y @modelcontextprotocol/server-everything" class="flex-1 bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none font-mono"><button class="p-3 text-red-400 hover:text-red-300 bg-gray-800 rounded-lg"> ✕ </button></div>`);
      });
      _push(`<!--]-->`);
      if (!activeMcpServers.value.length) {
        _push(`<p class="text-xs text-gray-500">Nessun server MCP attivo.</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></section><section class="bg-gray-900 rounded-xl border border-gray-800 flex flex-col h-[500px]"><div class="flex-1 p-6 overflow-y-auto space-y-4"><!--[-->`);
      ssrRenderList(messages.value, (msg, i) => {
        _push(`<div class="${ssrRenderClass([msg.role === "user" ? "items-end" : "items-start", "flex flex-col"])}"><div class="${ssrRenderClass([msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200", "max-w-[80%] rounded-xl p-4 text-sm whitespace-pre-wrap"])}">${ssrInterpolate(msg.content)}</div></div>`);
      });
      _push(`<!--]-->`);
      if (loading.value) {
        _push(`<div class="text-gray-500 text-sm italic">${ssrInterpolate(typeof loading.value === "string" ? loading.value : "Agent is thinking...")}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><form class="p-4 border-t border-gray-800 flex gap-2"><input${ssrRenderAttr("value", input.value)} type="text" placeholder="Ask something..." class="flex-1 bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"><button type="submit"${ssrIncludeBooleanAttr(loading.value || !input.value) ? " disabled" : ""} class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-lg transition-colors"> Send </button></form></section></div></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    const status = Number(_error.statusCode || 500);
    const is404 = status === 404;
    const statusText = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = defineAsyncComponent(() => import('./error-404-D1XY33Dy.mjs'));
    const _Error = defineAsyncComponent(() => import('./error-500-BizJoRMO.mjs'));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ status: unref(status), statusText: unref(statusText), statusCode: unref(status), statusMessage: unref(statusText), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = () => null;
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup", []);
    const error = /* @__PURE__ */ useError();
    const abortRender = error.value && !nuxtApp.ssrContext.error;
    function invokeAppErrorHandler(err, target, info) {
      const errorHandler = nuxtApp.vueApp.config.errorHandler;
      if (errorHandler && !errorHandler.__nuxt_default) {
        try {
          errorHandler(err, target, info);
        } catch (handlerError) {
          console.error("[nuxt] Error in `app.config.errorHandler`", handlerError);
        }
      }
    }
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        invokeAppErrorHandler(err, target, info);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(abortRender)) {
            _push(`<div></div>`);
          } else if (unref(error)) {
            _push(ssrRenderComponent(unref(_sfc_main$1), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(_sfc_main$2), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(_sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      nuxt.payload.error ||= createError(error);
    }
    if (ssrContext && (ssrContext["~renderResponse"] || ssrContext._renderResponse)) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry_default = ((ssrContext) => entry(ssrContext));

export { useNuxtApp as a, useRuntimeConfig as b, nuxtLinkDefaults as c, entry_default as default, encodeRoutePath as e, navigateTo as n, resolveRouteObject as r, tryUseNuxtApp as t, useRouter as u };
//# sourceMappingURL=server.mjs.map
