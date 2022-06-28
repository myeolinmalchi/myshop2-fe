
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.48.0 */

    const { Error: Error_1, Object: Object_1$3, console: console_1$2 } = globals;

    // (251:0) {:else}
    function create_else_block$4(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$a(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$a, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location$1 = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location: location$1,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$l.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    //export const URL = 'http://localhost:9000';
    const URL$1 = 'http://49.50.174.103:9000';

    /* src\components\Header.svelte generated by Svelte v3.48.0 */
    const file$i = "src\\components\\Header.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (50:12) {:else}
    function create_else_block_1(ctx) {
    	let li0;
    	let a0;
    	let p0;
    	let t1;
    	let li1;
    	let a1;
    	let p1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li0 = element("li");
    			a0 = element("a");
    			p0 = element("p");
    			p0.textContent = "회원가입";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			p1 = element("p");
    			p1.textContent = "로그인";
    			attr_dev(p0, "class", "svelte-gbl6wu");
    			add_location(p0, file$i, 51, 47, 1627);
    			attr_dev(a0, "href", "/regist");
    			attr_dev(a0, "class", "svelte-gbl6wu");
    			add_location(a0, file$i, 51, 20, 1600);
    			attr_dev(li0, "class", "test svelte-gbl6wu");
    			add_location(li0, file$i, 50, 16, 1561);
    			attr_dev(p1, "class", "svelte-gbl6wu");
    			add_location(p1, file$i, 54, 46, 1748);
    			attr_dev(a1, "href", "/login");
    			attr_dev(a1, "class", "svelte-gbl6wu");
    			add_location(a1, file$i, 54, 20, 1722);
    			attr_dev(li1, "class", "test svelte-gbl6wu");
    			add_location(li1, file$i, 53, 16, 1683);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li0, anchor);
    			append_dev(li0, a0);
    			append_dev(a0, p0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, li1, anchor);
    			append_dev(li1, a1);
    			append_dev(a1, p1);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a0)),
    					action_destroyer(link.call(null, a1))
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(li1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(50:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (46:12) {#if token}
    function create_if_block_3(ctx) {
    	let li;
    	let a;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			p = element("p");
    			p.textContent = "로그아웃";
    			attr_dev(p, "class", "svelte-gbl6wu");
    			add_location(p, file$i, 47, 59, 1484);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "svelte-gbl6wu");
    			add_location(a, file$i, 47, 20, 1445);
    			attr_dev(li, "class", "test svelte-gbl6wu");
    			add_location(li, file$i, 46, 16, 1406);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, p);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a)),
    					listen_dev(a, "click", /*logout*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(46:12) {#if token}",
    		ctx
    	});

    	return block;
    }

    // (74:16) {#if categories}
    function create_if_block_2$3(ctx) {
    	let each_1_anchor;
    	let each_value_2 = /*categories*/ ctx[0];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2$3(get_each_context_2$3(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*categories*/ 1) {
    				each_value_2 = /*categories*/ ctx[0];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$3(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(74:16) {#if categories}",
    		ctx
    	});

    	return block;
    }

    // (75:20) {#each categories as category}
    function create_each_block_2$3(ctx) {
    	let option;
    	let t_value = /*category*/ ctx[3].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*category*/ ctx[3].code;
    			option.value = option.__value;
    			add_location(option, file$i, 75, 24, 2369);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*categories*/ 1 && t_value !== (t_value = /*category*/ ctx[3].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*categories*/ 1 && option_value_value !== (option_value_value = /*category*/ ctx[3].code)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$3.name,
    		type: "each",
    		source: "(75:20) {#each categories as category}",
    		ctx
    	});

    	return block;
    }

    // (117:12) {:else}
    function create_else_block$3(ctx) {
    	let li;
    	let a;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			a.textContent = " ";
    			attr_dev(a, "class", "category-tit svelte-gbl6wu");
    			attr_dev(a, "href", "/");
    			add_location(a, file$i, 118, 20, 4028);
    			attr_dev(li, "class", "svelte-gbl6wu");
    			add_location(li, file$i, 117, 16, 4002);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(117:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (100:12) {#if categories}
    function create_if_block$9(ctx) {
    	let each_1_anchor;
    	let each_value = /*categories*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*categories*/ 1) {
    				each_value = /*categories*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(100:12) {#if categories}",
    		ctx
    	});

    	return block;
    }

    // (105:28) {#if category.children}
    function create_if_block_1$5(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*category*/ ctx[3].children;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$6(get_each_context_1$6(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*categories*/ 1) {
    				each_value_1 = /*category*/ ctx[3].children;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$6(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(105:28) {#if category.children}",
    		ctx
    	});

    	return block;
    }

    // (106:32) {#each category.children as child}
    function create_each_block_1$6(ctx) {
    	let li;
    	let a;
    	let t0_value = /*child*/ ctx[11].name + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "class", "sub-tit svelte-gbl6wu");
    			attr_dev(a, "href", "/");
    			add_location(a, file$i, 107, 40, 3629);
    			attr_dev(li, "class", "svelte-gbl6wu");
    			add_location(li, file$i, 106, 36, 3583);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*categories*/ 1 && t0_value !== (t0_value = /*child*/ ctx[11].name + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$6.name,
    		type: "each",
    		source: "(106:32) {#each category.children as child}",
    		ctx
    	});

    	return block;
    }

    // (101:16) {#each categories as category}
    function create_each_block$8(ctx) {
    	let li;
    	let a;
    	let t0_value = /*category*/ ctx[3].name + "";
    	let t0;
    	let t1;
    	let ul;
    	let t2;
    	let if_block = /*category*/ ctx[3].children && create_if_block_1$5(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			ul = element("ul");
    			if (if_block) if_block.c();
    			t2 = space();
    			attr_dev(a, "class", "category-tit svelte-gbl6wu");
    			attr_dev(a, "href", "/");
    			add_location(a, file$i, 102, 24, 3326);
    			attr_dev(ul, "class", "submenu svelte-gbl6wu");
    			add_location(ul, file$i, 103, 24, 3404);
    			attr_dev(li, "class", "svelte-gbl6wu");
    			add_location(li, file$i, 101, 20, 3296);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    			append_dev(li, ul);
    			if (if_block) if_block.m(ul, null);
    			append_dev(li, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*categories*/ 1 && t0_value !== (t0_value = /*category*/ ctx[3].name + "")) set_data_dev(t0, t0_value);

    			if (/*category*/ ctx[3].children) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$5(ctx);
    					if_block.c();
    					if_block.m(ul, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(101:16) {#each categories as category}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let div8;
    	let div0;
    	let ul0;
    	let t0;
    	let header;
    	let div1;
    	let img;
    	let img_src_value;
    	let t1;
    	let div2;
    	let select;
    	let option;
    	let t3;
    	let input;
    	let t4;
    	let button;
    	let t6;
    	let div7;
    	let div4;
    	let a0;
    	let i0;
    	let t7;
    	let div3;
    	let t9;
    	let div6;
    	let a1;
    	let i1;
    	let t10;
    	let div5;
    	let t12;
    	let nav;
    	let ul1;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*token*/ ctx[2]) return create_if_block_3;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*categories*/ ctx[0] && create_if_block_2$3(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*categories*/ ctx[0]) return create_if_block$9;
    		return create_else_block$3;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block2 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div0 = element("div");
    			ul0 = element("ul");
    			if_block0.c();
    			t0 = space();
    			header = element("header");
    			div1 = element("div");
    			img = element("img");
    			t1 = space();
    			div2 = element("div");
    			select = element("select");
    			option = element("option");
    			option.textContent = "전체";
    			if (if_block1) if_block1.c();
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			button = element("button");
    			button.textContent = "검색";
    			t6 = space();
    			div7 = element("div");
    			div4 = element("div");
    			a0 = element("a");
    			i0 = element("i");
    			t7 = space();
    			div3 = element("div");
    			div3.textContent = "마이페이지";
    			t9 = space();
    			div6 = element("div");
    			a1 = element("a");
    			i1 = element("i");
    			t10 = space();
    			div5 = element("div");
    			div5.textContent = "장바구니";
    			t12 = space();
    			nav = element("nav");
    			ul1 = element("ul");
    			if_block2.c();
    			attr_dev(ul0, "class", "top-menu svelte-gbl6wu");
    			add_location(ul0, file$i, 44, 8, 1342);
    			attr_dev(div0, "class", "top svelte-gbl6wu");
    			add_location(div0, file$i, 43, 4, 1315);
    			if (!src_url_equal(img.src, img_src_value = "images/logo/logosmall2.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "width", "240");
    			attr_dev(img, "height", "100");
    			add_location(img, file$i, 61, 12, 1887);
    			attr_dev(div1, "class", "logo svelte-gbl6wu");
    			add_location(div1, file$i, 60, 8, 1855);
    			option.__value = "0";
    			option.value = option.__value;
    			option.selected = true;
    			add_location(option, file$i, 72, 16, 2219);
    			attr_dev(select, "class", "select-space svelte-gbl6wu");
    			if (/*category*/ ctx[3] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[7].call(select));
    			add_location(select, file$i, 71, 12, 2150);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "검색어 입력");
    			attr_dev(input, "class", "svelte-gbl6wu");
    			add_location(input, file$i, 79, 12, 2512);
    			attr_dev(button, "class", "svelte-gbl6wu");
    			add_location(button, file$i, 80, 12, 2589);
    			attr_dev(div2, "class", "search svelte-gbl6wu");
    			add_location(div2, file$i, 70, 8, 2116);
    			attr_dev(i0, "class", "fa fa-user");
    			add_location(i0, file$i, 85, 21, 2771);
    			attr_dev(div3, "class", "icon-text svelte-gbl6wu");
    			add_location(div3, file$i, 86, 20, 2817);
    			attr_dev(a0, "href", "/mypage");
    			attr_dev(a0, "class", "svelte-gbl6wu");
    			add_location(a0, file$i, 84, 16, 2722);
    			attr_dev(div4, "class", "Mypage svelte-gbl6wu");
    			add_location(div4, file$i, 83, 12, 2684);
    			attr_dev(i1, "class", "fa fa-shopping-cart");
    			add_location(i1, file$i, 91, 21, 2990);
    			attr_dev(div5, "class", "icon-text svelte-gbl6wu");
    			add_location(div5, file$i, 92, 20, 3045);
    			attr_dev(a1, "href", "/cart");
    			attr_dev(a1, "class", "svelte-gbl6wu");
    			add_location(a1, file$i, 90, 16, 2943);
    			attr_dev(div6, "class", "cart svelte-gbl6wu");
    			add_location(div6, file$i, 89, 12, 2907);
    			attr_dev(div7, "class", "icon svelte-gbl6wu");
    			add_location(div7, file$i, 82, 8, 2652);
    			add_location(header, file$i, 59, 4, 1837);
    			attr_dev(ul1, "class", "menu-hedaer svelte-gbl6wu");
    			add_location(ul1, file$i, 98, 8, 3172);
    			attr_dev(nav, "class", "svelte-gbl6wu");
    			add_location(nav, file$i, 97, 4, 3157);
    			attr_dev(div8, "class", "header-container svelte-gbl6wu");
    			add_location(div8, file$i, 42, 0, 1279);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div0);
    			append_dev(div0, ul0);
    			if_block0.m(ul0, null);
    			append_dev(div8, t0);
    			append_dev(div8, header);
    			append_dev(header, div1);
    			append_dev(div1, img);
    			append_dev(header, t1);
    			append_dev(header, div2);
    			append_dev(div2, select);
    			append_dev(select, option);
    			if (if_block1) if_block1.m(select, null);
    			select_option(select, /*category*/ ctx[3]);
    			append_dev(div2, t3);
    			append_dev(div2, input);
    			set_input_value(input, /*keyword*/ ctx[1]);
    			append_dev(div2, t4);
    			append_dev(div2, button);
    			append_dev(header, t6);
    			append_dev(header, div7);
    			append_dev(div7, div4);
    			append_dev(div4, a0);
    			append_dev(a0, i0);
    			append_dev(a0, t7);
    			append_dev(a0, div3);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div6, a1);
    			append_dev(a1, i1);
    			append_dev(a1, t10);
    			append_dev(a1, div5);
    			append_dev(div8, t12);
    			append_dev(div8, nav);
    			append_dev(nav, ul1);
    			if_block2.m(ul1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img, "click", /*click_handler*/ ctx[6], false, false, false),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[7]),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    					listen_dev(button, "click", /*search*/ ctx[5], false, false, false),
    					action_destroyer(link.call(null, a0)),
    					action_destroyer(link.call(null, a1))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(ul0, null);
    				}
    			}

    			if (/*categories*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$3(ctx);
    					if_block1.c();
    					if_block1.m(select, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*category, categories*/ 9) {
    				select_option(select, /*category*/ ctx[3]);
    			}

    			if (dirty & /*keyword*/ 2 && input.value !== /*keyword*/ ctx[1]) {
    				set_input_value(input, /*keyword*/ ctx[1]);
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_1(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(ul1, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let token;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);

    	onMount(async () => {
    		const res = await fetch(`${URL$1}/api/v1/category/main`, {
    			method: 'GET',
    			mode: 'cors',
    			headers: {
    				Accept: 'application/json',
    				'Content-Type': 'application/json'
    			},
    			credentials: 'include'
    		});

    		const jsonBody = await res.json();

    		$$invalidate(0, categories = await Promise.all(jsonBody.map(async category => {
    			const code = category[0];
    			const name = category[1];
    			const res = await fetch(`${URL$1}/api/v1/category/${code}/children`);
    			const jsonBody = await res.json();

    			const children = jsonBody.map(category => {
    				return { code: category[0], name: category[1] };
    			});

    			return { code, name, children };
    		})));
    	});

    	const logout = () => {
    		localStorage.removeItem('userId');
    		localStorage.removeItem('token');
    		$$invalidate(2, token = '');
    	};

    	let categories;
    	let category;
    	let keyword;

    	const search = () => {
    		push(`/product/search/${category}/${keyword}`);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => push('/');

    	function select_change_handler() {
    		category = select_value(this);
    		$$invalidate(3, category);
    		$$invalidate(0, categories);
    	}

    	function input_input_handler() {
    		keyword = this.value;
    		$$invalidate(1, keyword);
    	}

    	$$self.$capture_state = () => ({
    		link,
    		push,
    		onMount,
    		URL: URL$1,
    		logout,
    		categories,
    		category,
    		keyword,
    		search,
    		token
    	});

    	$$self.$inject_state = $$props => {
    		if ('categories' in $$props) $$invalidate(0, categories = $$props.categories);
    		if ('category' in $$props) $$invalidate(3, category = $$props.category);
    		if ('keyword' in $$props) $$invalidate(1, keyword = $$props.keyword);
    		if ('token' in $$props) $$invalidate(2, token = $$props.token);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(2, token = localStorage.getItem('token'));

    	return [
    		categories,
    		keyword,
    		token,
    		category,
    		logout,
    		search,
    		click_handler,
    		select_change_handler,
    		input_input_handler
    	];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\routes\Main.svelte generated by Svelte v3.48.0 */
    const file$h = "src\\routes\\Main.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (106:16) {#each products as product}
    function create_each_block$7(ctx) {
    	let li;
    	let a;
    	let dl;
    	let dt;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let dd;
    	let h3;
    	let t1_value = /*product*/ ctx[1].name + "";
    	let t1;
    	let t2;
    	let strong;
    	let t3_value = /*product*/ ctx[1].price.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',') + "";
    	let t3;
    	let t4;
    	let t5;
    	let p;
    	let span0;
    	let b;
    	let t6_value = /*product*/ ctx[1].rating + "";
    	let t6;
    	let t7;
    	let span1;
    	let t8;
    	let t9_value = /*product*/ ctx[1].reviewCount + "";
    	let t9;
    	let t10;
    	let a_href_value;
    	let t11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			dl = element("dl");
    			dt = element("dt");
    			img = element("img");
    			t0 = space();
    			dd = element("dd");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			strong = element("strong");
    			t3 = text(t3_value);
    			t4 = text("원");
    			t5 = space();
    			p = element("p");
    			span0 = element("span");
    			b = element("b");
    			t6 = text(t6_value);
    			t7 = space();
    			span1 = element("span");
    			t8 = text("(");
    			t9 = text(t9_value);
    			t10 = text(")");
    			t11 = space();
    			if (!src_url_equal(img.src, img_src_value = /*product*/ ctx[1].thumbnail)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*product*/ ctx[1].name);
    			attr_dev(img, "class", "svelte-178b5f8");
    			add_location(img, file$h, 110, 36, 3777);
    			attr_dev(dt, "class", "images svelte-178b5f8");
    			add_location(dt, file$h, 109, 32, 3720);
    			attr_dev(h3, "class", "product-name svelte-178b5f8");
    			add_location(h3, file$h, 117, 36, 4063);
    			attr_dev(strong, "class", "product-price svelte-178b5f8");
    			add_location(strong, file$h, 120, 36, 4225);
    			attr_dev(b, "class", "rating svelte-178b5f8");
    			set_style(b, "width", /*product*/ ctx[1].rating * 20 + "%");
    			add_location(b, file$h, 130, 44, 4825);
    			attr_dev(span0, "class", "star svelte-178b5f8");
    			add_location(span0, file$h, 129, 40, 4760);
    			attr_dev(span1, "class", "rating-total-count svelte-178b5f8");
    			add_location(span1, file$h, 136, 40, 5189);
    			attr_dev(p, "class", "rating_star svelte-178b5f8");
    			add_location(p, file$h, 128, 36, 4695);
    			attr_dev(dd, "class", "svelte-178b5f8");
    			add_location(dd, file$h, 116, 32, 4021);
    			attr_dev(dl, "class", "svelte-178b5f8");
    			add_location(dl, file$h, 108, 28, 3682);
    			attr_dev(a, "href", a_href_value = "/product/detail/" + /*product*/ ctx[1].productId);
    			attr_dev(a, "class", "svelte-178b5f8");
    			add_location(a, file$h, 107, 24, 3597);
    			attr_dev(li, "class", "svelte-178b5f8");
    			add_location(li, file$h, 106, 20, 3567);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, dl);
    			append_dev(dl, dt);
    			append_dev(dt, img);
    			append_dev(dt, t0);
    			append_dev(dl, dd);
    			append_dev(dd, h3);
    			append_dev(h3, t1);
    			append_dev(dd, t2);
    			append_dev(dd, strong);
    			append_dev(strong, t3);
    			append_dev(strong, t4);
    			append_dev(dd, t5);
    			append_dev(dd, p);
    			append_dev(p, span0);
    			append_dev(span0, b);
    			append_dev(b, t6);
    			append_dev(p, t7);
    			append_dev(p, span1);
    			append_dev(span1, t8);
    			append_dev(span1, t9);
    			append_dev(span1, t10);
    			append_dev(li, t11);

    			if (!mounted) {
    				dispose = action_destroyer(link.call(null, a));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*products*/ 1 && !src_url_equal(img.src, img_src_value = /*product*/ ctx[1].thumbnail)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*products*/ 1 && img_alt_value !== (img_alt_value = /*product*/ ctx[1].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*products*/ 1 && t1_value !== (t1_value = /*product*/ ctx[1].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*products*/ 1 && t3_value !== (t3_value = /*product*/ ctx[1].price.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',') + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*products*/ 1 && t6_value !== (t6_value = /*product*/ ctx[1].rating + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*products*/ 1) {
    				set_style(b, "width", /*product*/ ctx[1].rating * 20 + "%");
    			}

    			if (dirty & /*products*/ 1 && t9_value !== (t9_value = /*product*/ ctx[1].reviewCount + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*products*/ 1 && a_href_value !== (a_href_value = "/product/detail/" + /*product*/ ctx[1].productId)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(106:16) {#each products as product}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let header;
    	let t0;
    	let div23;
    	let div4;
    	let input0;
    	let t1;
    	let input1;
    	let t2;
    	let input2;
    	let t3;
    	let input3;
    	let t4;
    	let ul0;
    	let li0;
    	let div0;
    	let label0;
    	let t5;
    	let label1;
    	let t6;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t7;
    	let li1;
    	let div1;
    	let label2;
    	let t8;
    	let label3;
    	let t9;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let t10;
    	let li2;
    	let div2;
    	let label4;
    	let t11;
    	let label5;
    	let t12;
    	let a2;
    	let img2;
    	let img2_src_value;
    	let t13;
    	let li3;
    	let div3;
    	let label6;
    	let t14;
    	let label7;
    	let t15;
    	let a3;
    	let img3;
    	let img3_src_value;
    	let t16;
    	let ul1;
    	let li4;
    	let label8;
    	let t17;
    	let li5;
    	let label9;
    	let t18;
    	let li6;
    	let label10;
    	let t19;
    	let li7;
    	let label11;
    	let t20;
    	let div5;
    	let article;
    	let h2;
    	let i0;
    	let t21;
    	let t22;
    	let ul2;
    	let t23;
    	let hr;
    	let t24;
    	let footer;
    	let div12;
    	let div7;
    	let div6;
    	let t26;
    	let p0;
    	let t28;
    	let p1;
    	let t30;
    	let div9;
    	let div8;
    	let t32;
    	let p2;
    	let t34;
    	let a4;
    	let button0;
    	let img4;
    	let img4_src_value;
    	let t35;
    	let t36;
    	let div11;
    	let div10;
    	let t38;
    	let p3;
    	let t40;
    	let a5;
    	let button1;
    	let t42;
    	let div13;
    	let t43;
    	let div22;
    	let div21;
    	let div18;
    	let div14;
    	let i1;
    	let t44;
    	let div15;
    	let i2;
    	let t45;
    	let div16;
    	let i3;
    	let t46;
    	let div17;
    	let i4;
    	let t47;
    	let div20;
    	let div19;
    	let current;
    	header = new Header({ $$inline: true });
    	let each_value = /*products*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div23 = element("div");
    			div4 = element("div");
    			input0 = element("input");
    			t1 = space();
    			input1 = element("input");
    			t2 = space();
    			input2 = element("input");
    			t3 = space();
    			input3 = element("input");
    			t4 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			div0 = element("div");
    			label0 = element("label");
    			t5 = space();
    			label1 = element("label");
    			t6 = space();
    			a0 = element("a");
    			img0 = element("img");
    			t7 = space();
    			li1 = element("li");
    			div1 = element("div");
    			label2 = element("label");
    			t8 = space();
    			label3 = element("label");
    			t9 = space();
    			a1 = element("a");
    			img1 = element("img");
    			t10 = space();
    			li2 = element("li");
    			div2 = element("div");
    			label4 = element("label");
    			t11 = space();
    			label5 = element("label");
    			t12 = space();
    			a2 = element("a");
    			img2 = element("img");
    			t13 = space();
    			li3 = element("li");
    			div3 = element("div");
    			label6 = element("label");
    			t14 = space();
    			label7 = element("label");
    			t15 = space();
    			a3 = element("a");
    			img3 = element("img");
    			t16 = space();
    			ul1 = element("ul");
    			li4 = element("li");
    			label8 = element("label");
    			t17 = space();
    			li5 = element("li");
    			label9 = element("label");
    			t18 = space();
    			li6 = element("li");
    			label10 = element("label");
    			t19 = space();
    			li7 = element("li");
    			label11 = element("label");
    			t20 = space();
    			div5 = element("div");
    			article = element("article");
    			h2 = element("h2");
    			i0 = element("i");
    			t21 = text(" 이 상품은\r\n                어떠세요?");
    			t22 = space();
    			ul2 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t23 = space();
    			hr = element("hr");
    			t24 = space();
    			footer = element("footer");
    			div12 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div6.textContent = "전화문의";
    			t26 = space();
    			p0 = element("p");
    			p0.textContent = "10시~17시";
    			t28 = space();
    			p1 = element("p");
    			p1.textContent = "0626-xxxx";
    			t30 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div8.textContent = "카톡문의";
    			t32 = space();
    			p2 = element("p");
    			p2.textContent = "10시~17시";
    			t34 = space();
    			a4 = element("a");
    			button0 = element("button");
    			img4 = element("img");
    			t35 = text(" 카톡문의");
    			t36 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div10.textContent = "입점문의";
    			t38 = space();
    			p3 = element("p");
    			p3.textContent = "sunny100487@naver.com";
    			t40 = space();
    			a5 = element("a");
    			button1 = element("button");
    			button1.textContent = "입점 신청하기";
    			t42 = space();
    			div13 = element("div");
    			t43 = space();
    			div22 = element("div");
    			div21 = element("div");
    			div18 = element("div");
    			div14 = element("div");
    			i1 = element("i");
    			t44 = space();
    			div15 = element("div");
    			i2 = element("i");
    			t45 = space();
    			div16 = element("div");
    			i3 = element("i");
    			t46 = space();
    			div17 = element("div");
    			i4 = element("i");
    			t47 = space();
    			div20 = element("div");
    			div19 = element("div");
    			div19.textContent = "Copyright © My shop Corp. All Rights Reserved.";
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "name", "slide");
    			attr_dev(input0, "id", "slide01");
    			input0.checked = true;
    			attr_dev(input0, "class", "svelte-178b5f8");
    			add_location(input0, file$h, 17, 8, 473);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", "slide");
    			attr_dev(input1, "id", "slide02");
    			attr_dev(input1, "class", "svelte-178b5f8");
    			add_location(input1, file$h, 18, 8, 539);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "name", "slide");
    			attr_dev(input2, "id", "slide03");
    			attr_dev(input2, "class", "svelte-178b5f8");
    			add_location(input2, file$h, 19, 8, 597);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "name", "slide");
    			attr_dev(input3, "id", "slide04");
    			attr_dev(input3, "class", "svelte-178b5f8");
    			add_location(input3, file$h, 20, 8, 655);
    			attr_dev(label0, "for", "slide04");
    			attr_dev(label0, "class", "left svelte-178b5f8");
    			add_location(label0, file$h, 24, 20, 816);
    			attr_dev(label1, "for", "slide02");
    			attr_dev(label1, "class", "right svelte-178b5f8");
    			add_location(label1, file$h, 25, 20, 874);
    			if (!src_url_equal(img0.src, img0_src_value = "./images/slide01.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "1024");
    			attr_dev(img0, "height", "650");
    			attr_dev(img0, "alt", "01");
    			attr_dev(img0, "class", "svelte-178b5f8");
    			add_location(img0, file$h, 27, 25, 971);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-178b5f8");
    			add_location(a0, file$h, 26, 20, 933);
    			attr_dev(div0, "class", "svelte-178b5f8");
    			add_location(div0, file$h, 23, 16, 789);
    			attr_dev(li0, "class", "slideitem svelte-178b5f8");
    			add_location(li0, file$h, 22, 12, 749);
    			attr_dev(label2, "for", "slide01");
    			attr_dev(label2, "class", "left svelte-178b5f8");
    			add_location(label2, file$h, 38, 20, 1331);
    			attr_dev(label3, "for", "slide03");
    			attr_dev(label3, "class", "right svelte-178b5f8");
    			add_location(label3, file$h, 39, 20, 1389);
    			if (!src_url_equal(img1.src, img1_src_value = "./images/slide02.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "width", "1024");
    			attr_dev(img1, "height", "650");
    			attr_dev(img1, "alt", "02");
    			attr_dev(img1, "class", "svelte-178b5f8");
    			add_location(img1, file$h, 41, 25, 1486);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "class", "svelte-178b5f8");
    			add_location(a1, file$h, 40, 20, 1448);
    			attr_dev(div1, "class", "svelte-178b5f8");
    			add_location(div1, file$h, 37, 16, 1304);
    			attr_dev(li1, "class", "slideitem svelte-178b5f8");
    			add_location(li1, file$h, 36, 12, 1264);
    			attr_dev(label4, "for", "slide02");
    			attr_dev(label4, "class", "left svelte-178b5f8");
    			add_location(label4, file$h, 52, 20, 1846);
    			attr_dev(label5, "for", "slide04");
    			attr_dev(label5, "class", "right svelte-178b5f8");
    			add_location(label5, file$h, 53, 20, 1904);
    			if (!src_url_equal(img2.src, img2_src_value = "./images/slide03.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "width", "1024");
    			attr_dev(img2, "height", "650");
    			attr_dev(img2, "alt", "03");
    			attr_dev(img2, "class", "svelte-178b5f8");
    			add_location(img2, file$h, 55, 25, 2001);
    			attr_dev(a2, "href", "/");
    			attr_dev(a2, "class", "svelte-178b5f8");
    			add_location(a2, file$h, 54, 20, 1963);
    			attr_dev(div2, "class", "svelte-178b5f8");
    			add_location(div2, file$h, 51, 16, 1819);
    			attr_dev(li2, "class", "slideitem svelte-178b5f8");
    			add_location(li2, file$h, 50, 12, 1779);
    			attr_dev(label6, "for", "slide03");
    			attr_dev(label6, "class", "left svelte-178b5f8");
    			add_location(label6, file$h, 66, 20, 2361);
    			attr_dev(label7, "for", "slide01");
    			attr_dev(label7, "class", "right svelte-178b5f8");
    			add_location(label7, file$h, 67, 20, 2419);
    			if (!src_url_equal(img3.src, img3_src_value = "./images/slide04.jpg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "width", "1024");
    			attr_dev(img3, "height", "650");
    			attr_dev(img3, "alt", "04");
    			attr_dev(img3, "class", "svelte-178b5f8");
    			add_location(img3, file$h, 69, 25, 2516);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "class", "svelte-178b5f8");
    			add_location(a3, file$h, 68, 20, 2478);
    			attr_dev(div3, "class", "svelte-178b5f8");
    			add_location(div3, file$h, 65, 16, 2334);
    			attr_dev(li3, "class", "slideitem svelte-178b5f8");
    			add_location(li3, file$h, 64, 12, 2294);
    			attr_dev(ul0, "class", "slidelist svelte-178b5f8");
    			add_location(ul0, file$h, 21, 8, 713);
    			attr_dev(label8, "for", "slide01");
    			attr_dev(label8, "class", "svelte-178b5f8");
    			add_location(label8, file$h, 81, 16, 2879);
    			attr_dev(li4, "class", "svelte-178b5f8");
    			add_location(li4, file$h, 80, 12, 2857);
    			attr_dev(label9, "for", "slide02");
    			attr_dev(label9, "class", "svelte-178b5f8");
    			add_location(label9, file$h, 84, 16, 2957);
    			attr_dev(li5, "class", "svelte-178b5f8");
    			add_location(li5, file$h, 83, 12, 2935);
    			attr_dev(label10, "for", "slide03");
    			attr_dev(label10, "class", "svelte-178b5f8");
    			add_location(label10, file$h, 87, 16, 3035);
    			attr_dev(li6, "class", "svelte-178b5f8");
    			add_location(li6, file$h, 86, 12, 3013);
    			attr_dev(label11, "for", "slide04");
    			attr_dev(label11, "class", "svelte-178b5f8");
    			add_location(label11, file$h, 90, 16, 3113);
    			attr_dev(li7, "class", "svelte-178b5f8");
    			add_location(li7, file$h, 89, 12, 3091);
    			attr_dev(ul1, "class", "paginglist svelte-178b5f8");
    			add_location(ul1, file$h, 79, 8, 2820);
    			attr_dev(div4, "class", "slidebox svelte-178b5f8");
    			add_location(div4, file$h, 16, 4, 441);
    			attr_dev(i0, "class", "fa fa-calendar-check svelte-178b5f8");
    			set_style(i0, "color", "purple");
    			add_location(i0, file$h, 101, 16, 3356);
    			attr_dev(h2, "class", "tit svelte-178b5f8");
    			add_location(h2, file$h, 100, 12, 3322);
    			attr_dev(ul2, "class", "recommend-list svelte-178b5f8");
    			add_location(ul2, file$h, 104, 12, 3473);
    			attr_dev(article, "class", "recommend-goods svelte-178b5f8");
    			add_location(article, file$h, 99, 8, 3275);
    			attr_dev(div5, "class", "recommend_box svelte-178b5f8");
    			add_location(div5, file$h, 97, 4, 3214);
    			attr_dev(hr, "class", "svelte-178b5f8");
    			add_location(hr, file$h, 153, 4, 5647);
    			attr_dev(div6, "class", "f-tit svelte-178b5f8");
    			add_location(div6, file$h, 158, 16, 5771);
    			attr_dev(p0, "class", "txt svelte-178b5f8");
    			add_location(p0, file$h, 159, 16, 5818);
    			attr_dev(p1, "class", "num svelte-178b5f8");
    			add_location(p1, file$h, 160, 16, 5862);
    			attr_dev(div7, "class", "footer-itembox svelte-178b5f8");
    			add_location(div7, file$h, 157, 12, 5725);
    			attr_dev(div8, "class", "f-tit svelte-178b5f8");
    			add_location(div8, file$h, 163, 16, 5970);
    			attr_dev(p2, "class", "txt svelte-178b5f8");
    			add_location(p2, file$h, 164, 16, 6017);
    			if (!src_url_equal(img4.src, img4_src_value = "./images/kakao-icon.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "width", "15");
    			attr_dev(img4, "height", "13");
    			attr_dev(img4, "alt", "카톡문의");
    			attr_dev(img4, "class", "svelte-178b5f8");
    			add_location(img4, file$h, 167, 25, 6147);
    			attr_dev(button0, "class", "kakao-btn svelte-178b5f8");
    			add_location(button0, file$h, 166, 21, 6095);
    			attr_dev(a4, "href", "/");
    			attr_dev(a4, "class", "svelte-178b5f8");
    			add_location(a4, file$h, 165, 16, 6061);
    			attr_dev(div9, "class", "footer-itembox svelte-178b5f8");
    			add_location(div9, file$h, 162, 12, 5924);
    			attr_dev(div10, "class", "f-tit svelte-178b5f8");
    			add_location(div10, file$h, 177, 16, 6497);
    			attr_dev(p3, "class", "txt svelte-178b5f8");
    			add_location(p3, file$h, 178, 16, 6544);
    			attr_dev(button1, "class", "enter-store svelte-178b5f8");
    			add_location(button1, file$h, 179, 27, 6613);
    			attr_dev(a5, "href", "");
    			attr_dev(a5, "class", "svelte-178b5f8");
    			add_location(a5, file$h, 179, 16, 6602);
    			attr_dev(div11, "class", "footer-itembox svelte-178b5f8");
    			add_location(div11, file$h, 176, 12, 6451);
    			attr_dev(div12, "class", "row svelte-178b5f8");
    			add_location(div12, file$h, 156, 8, 5694);
    			attr_dev(div13, "class", "lg-line svelte-178b5f8");
    			add_location(div13, file$h, 183, 8, 6725);
    			attr_dev(i1, "class", "fa fa-instagram svelte-178b5f8");
    			add_location(i1, file$h, 187, 40, 6889);
    			attr_dev(div14, "class", "s-icon svelte-178b5f8");
    			add_location(div14, file$h, 187, 20, 6869);
    			attr_dev(i2, "class", "fa fa-facebook svelte-178b5f8");
    			add_location(i2, file$h, 188, 40, 6966);
    			attr_dev(div15, "class", "s-icon svelte-178b5f8");
    			add_location(div15, file$h, 188, 20, 6946);
    			attr_dev(i3, "class", "fa fa-twitter svelte-178b5f8");
    			add_location(i3, file$h, 189, 40, 7042);
    			attr_dev(div16, "class", "s-icon svelte-178b5f8");
    			add_location(div16, file$h, 189, 20, 7022);
    			attr_dev(i4, "class", "fa fa-youtube svelte-178b5f8");
    			add_location(i4, file$h, 190, 40, 7117);
    			attr_dev(div17, "class", "s-icon svelte-178b5f8");
    			add_location(div17, file$h, 190, 20, 7097);
    			attr_dev(div18, "class", "sns-icon svelte-178b5f8");
    			add_location(div18, file$h, 186, 16, 6825);
    			attr_dev(div19, "class", "svelte-178b5f8");
    			add_location(div19, file$h, 193, 20, 7242);
    			attr_dev(div20, "class", "copyright-wrap svelte-178b5f8");
    			add_location(div20, file$h, 192, 16, 7192);
    			attr_dev(div21, "class", "info svelte-178b5f8");
    			add_location(div21, file$h, 185, 12, 6789);
    			attr_dev(div22, "class", "row svelte-178b5f8");
    			add_location(div22, file$h, 184, 8, 6758);
    			attr_dev(footer, "class", "svelte-178b5f8");
    			add_location(footer, file$h, 155, 4, 5676);
    			attr_dev(div23, "class", "home-container svelte-178b5f8");
    			add_location(div23, file$h, 14, 0, 382);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div23, anchor);
    			append_dev(div23, div4);
    			append_dev(div4, input0);
    			append_dev(div4, t1);
    			append_dev(div4, input1);
    			append_dev(div4, t2);
    			append_dev(div4, input2);
    			append_dev(div4, t3);
    			append_dev(div4, input3);
    			append_dev(div4, t4);
    			append_dev(div4, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t5);
    			append_dev(div0, label1);
    			append_dev(div0, t6);
    			append_dev(div0, a0);
    			append_dev(a0, img0);
    			append_dev(ul0, t7);
    			append_dev(ul0, li1);
    			append_dev(li1, div1);
    			append_dev(div1, label2);
    			append_dev(div1, t8);
    			append_dev(div1, label3);
    			append_dev(div1, t9);
    			append_dev(div1, a1);
    			append_dev(a1, img1);
    			append_dev(ul0, t10);
    			append_dev(ul0, li2);
    			append_dev(li2, div2);
    			append_dev(div2, label4);
    			append_dev(div2, t11);
    			append_dev(div2, label5);
    			append_dev(div2, t12);
    			append_dev(div2, a2);
    			append_dev(a2, img2);
    			append_dev(ul0, t13);
    			append_dev(ul0, li3);
    			append_dev(li3, div3);
    			append_dev(div3, label6);
    			append_dev(div3, t14);
    			append_dev(div3, label7);
    			append_dev(div3, t15);
    			append_dev(div3, a3);
    			append_dev(a3, img3);
    			append_dev(div4, t16);
    			append_dev(div4, ul1);
    			append_dev(ul1, li4);
    			append_dev(li4, label8);
    			append_dev(ul1, t17);
    			append_dev(ul1, li5);
    			append_dev(li5, label9);
    			append_dev(ul1, t18);
    			append_dev(ul1, li6);
    			append_dev(li6, label10);
    			append_dev(ul1, t19);
    			append_dev(ul1, li7);
    			append_dev(li7, label11);
    			append_dev(div23, t20);
    			append_dev(div23, div5);
    			append_dev(div5, article);
    			append_dev(article, h2);
    			append_dev(h2, i0);
    			append_dev(h2, t21);
    			append_dev(article, t22);
    			append_dev(article, ul2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul2, null);
    			}

    			append_dev(div23, t23);
    			append_dev(div23, hr);
    			append_dev(div23, t24);
    			append_dev(div23, footer);
    			append_dev(footer, div12);
    			append_dev(div12, div7);
    			append_dev(div7, div6);
    			append_dev(div7, t26);
    			append_dev(div7, p0);
    			append_dev(div7, t28);
    			append_dev(div7, p1);
    			append_dev(div12, t30);
    			append_dev(div12, div9);
    			append_dev(div9, div8);
    			append_dev(div9, t32);
    			append_dev(div9, p2);
    			append_dev(div9, t34);
    			append_dev(div9, a4);
    			append_dev(a4, button0);
    			append_dev(button0, img4);
    			append_dev(button0, t35);
    			append_dev(div12, t36);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div11, t38);
    			append_dev(div11, p3);
    			append_dev(div11, t40);
    			append_dev(div11, a5);
    			append_dev(a5, button1);
    			append_dev(footer, t42);
    			append_dev(footer, div13);
    			append_dev(footer, t43);
    			append_dev(footer, div22);
    			append_dev(div22, div21);
    			append_dev(div21, div18);
    			append_dev(div18, div14);
    			append_dev(div14, i1);
    			append_dev(div18, t44);
    			append_dev(div18, div15);
    			append_dev(div15, i2);
    			append_dev(div18, t45);
    			append_dev(div18, div16);
    			append_dev(div16, i3);
    			append_dev(div18, t46);
    			append_dev(div18, div17);
    			append_dev(div17, i4);
    			append_dev(div21, t47);
    			append_dev(div21, div20);
    			append_dev(div20, div19);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*products*/ 1) {
    				each_value = /*products*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div23);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Main', slots, []);
    	let products = [];

    	onMount(async () => {
    		const res = await fetch(`${URL$1}/api/v1/product/random/8`);
    		$$invalidate(0, products = await res.json());
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header, link, URL: URL$1, onMount, products });

    	$$self.$inject_state = $$props => {
    		if ('products' in $$props) $$invalidate(0, products = $$props.products);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [products];
    }

    class Main$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\routes\product\ProductSearch.svelte generated by Svelte v3.48.0 */

    const { Object: Object_1$2 } = globals;
    const file$g = "src\\routes\\product\\ProductSearch.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    function get_each_context_1$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    // (66:0) {#if products}
    function create_if_block$8(ctx) {
    	let div5;
    	let h2;
    	let span;
    	let t0_value = /*params*/ ctx[0].keyword + "";
    	let t0;
    	let t1;
    	let t2;
    	let section0;
    	let div0;
    	let ul0;
    	let li0;
    	let button0;
    	let li0_class_value;
    	let t4;
    	let li1;
    	let button1;
    	let li1_class_value;
    	let t6;
    	let li2;
    	let button2;
    	let li2_class_value;
    	let t8;
    	let li3;
    	let button3;
    	let li3_class_value;
    	let t10;
    	let div1;
    	let p;
    	let t11;
    	let t12;
    	let t13;
    	let ul1;
    	let li4;
    	let input0;
    	let t14;
    	let label0;
    	let li4_class_value;
    	let t16;
    	let li5;
    	let input1;
    	let t17;
    	let label1;
    	let li5_class_value;
    	let t19;
    	let li6;
    	let input2;
    	let t20;
    	let label2;
    	let li6_class_value;
    	let t22;
    	let li7;
    	let input3;
    	let t23;
    	let label3;
    	let li7_class_value;
    	let t25;
    	let section1;
    	let ul2;
    	let t26;
    	let div4;
    	let div2;
    	let button4;
    	let t28;
    	let button5;
    	let t30;
    	let ul3;
    	let t31;
    	let div3;
    	let button6;
    	let t33;
    	let button7;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*products*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$5(get_each_context_1$5(ctx, each_value_1, i));
    	}

    	let each_value = Array(/*pageCount*/ ctx[3]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			h2 = element("h2");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text("에 대한 검색결과");
    			t2 = space();
    			section0 = element("section");
    			div0 = element("div");
    			ul0 = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			button0.textContent = "가격 낮은순";
    			t4 = space();
    			li1 = element("li");
    			button1 = element("button");
    			button1.textContent = "가격 높은순";
    			t6 = space();
    			li2 = element("li");
    			button2 = element("button");
    			button2.textContent = "리뷰 많은순";
    			t8 = space();
    			li3 = element("li");
    			button3 = element("button");
    			button3.textContent = "리뷰 적은순";
    			t10 = space();
    			div1 = element("div");
    			p = element("p");
    			t11 = text(/*size*/ ctx[1]);
    			t12 = text("개씩 보기");
    			t13 = space();
    			ul1 = element("ul");
    			li4 = element("li");
    			input0 = element("input");
    			t14 = space();
    			label0 = element("label");
    			label0.textContent = "36개씩 보기";
    			t16 = space();
    			li5 = element("li");
    			input1 = element("input");
    			t17 = space();
    			label1 = element("label");
    			label1.textContent = "48개씩 보기";
    			t19 = space();
    			li6 = element("li");
    			input2 = element("input");
    			t20 = space();
    			label2 = element("label");
    			label2.textContent = "60개씩 보기";
    			t22 = space();
    			li7 = element("li");
    			input3 = element("input");
    			t23 = space();
    			label3 = element("label");
    			label3.textContent = "72개씩 보기";
    			t25 = space();
    			section1 = element("section");
    			ul2 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t26 = space();
    			div4 = element("div");
    			div2 = element("div");
    			button4 = element("button");
    			button4.textContent = "<<";
    			t28 = space();
    			button5 = element("button");
    			button5.textContent = "<";
    			t30 = space();
    			ul3 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t31 = space();
    			div3 = element("div");
    			button6 = element("button");
    			button6.textContent = ">";
    			t33 = space();
    			button7 = element("button");
    			button7.textContent = ">>";
    			attr_dev(span, "class", "search-keyword");
    			add_location(span, file$g, 68, 12, 2259);
    			attr_dev(h2, "class", "page-title");
    			add_location(h2, file$g, 67, 8, 2222);
    			add_location(button0, file$g, 75, 24, 2515);
    			attr_dev(li0, "class", li0_class_value = /*checkSort*/ ctx[5](0));
    			add_location(li0, file$g, 74, 20, 2464);
    			add_location(button1, file$g, 78, 24, 2666);
    			attr_dev(li1, "class", li1_class_value = /*checkSort*/ ctx[5](1));
    			add_location(li1, file$g, 77, 20, 2615);
    			add_location(button2, file$g, 81, 24, 2817);
    			attr_dev(li2, "class", li2_class_value = /*checkSort*/ ctx[5](2));
    			add_location(li2, file$g, 80, 20, 2766);
    			add_location(button3, file$g, 84, 24, 2968);
    			attr_dev(li3, "class", li3_class_value = /*checkSort*/ ctx[5](3));
    			add_location(li3, file$g, 83, 20, 2917);
    			add_location(ul0, file$g, 73, 16, 2438);
    			attr_dev(div0, "class", "search-sorting");
    			add_location(div0, file$g, 72, 12, 2392);
    			attr_dev(p, "class", "now-list-size");
    			add_location(p, file$g, 90, 16, 3153);
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "name", "listSize");
    			attr_dev(input0, "id", "listSize-36");
    			add_location(input0, file$g, 93, 24, 3289);
    			attr_dev(label0, "for", "listSize-36");
    			add_location(label0, file$g, 99, 24, 3540);
    			attr_dev(li4, "class", li4_class_value = /*checkSize*/ ctx[6](36));
    			add_location(li4, file$g, 92, 20, 3237);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", "listSize");
    			attr_dev(input1, "id", "listSize-48");
    			add_location(input1, file$g, 102, 24, 3681);
    			attr_dev(label1, "for", "listSize-48");
    			add_location(label1, file$g, 108, 24, 3932);
    			attr_dev(li5, "class", li5_class_value = /*checkSize*/ ctx[6](48));
    			add_location(li5, file$g, 101, 20, 3629);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "name", "listSize");
    			attr_dev(input2, "id", "listSize-60");
    			add_location(input2, file$g, 111, 24, 4073);
    			attr_dev(label2, "for", "listSize-60");
    			add_location(label2, file$g, 117, 24, 4324);
    			attr_dev(li6, "class", li6_class_value = /*checkSize*/ ctx[6](60));
    			add_location(li6, file$g, 110, 20, 4021);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "name", "listSize");
    			attr_dev(input3, "id", "listSize-72");
    			add_location(input3, file$g, 120, 24, 4465);
    			attr_dev(label3, "for", "listSize-72");
    			add_location(label3, file$g, 126, 24, 4716);
    			attr_dev(li7, "class", li7_class_value = /*checkSize*/ ctx[6](72));
    			add_location(li7, file$g, 119, 20, 4413);
    			add_location(ul1, file$g, 91, 16, 3211);
    			attr_dev(div1, "class", "change-list-size");
    			add_location(div1, file$g, 89, 12, 3105);
    			attr_dev(section0, "class", "result-option");
    			add_location(section0, file$g, 71, 8, 2347);
    			attr_dev(ul2, "class", "result-list");
    			add_location(ul2, file$g, 133, 12, 4903);
    			add_location(button4, file$g, 178, 20, 7171);
    			add_location(button5, file$g, 179, 20, 7218);
    			attr_dev(div2, "class", "btn-grp prev-btn");
    			add_location(div2, file$g, 177, 16, 7119);
    			add_location(ul3, file$g, 181, 16, 7281);
    			add_location(button6, file$g, 191, 20, 7713);
    			add_location(button7, file$g, 192, 20, 7756);
    			attr_dev(div3, "class", "btn-grp next-btn");
    			add_location(div3, file$g, 190, 16, 7661);
    			attr_dev(div4, "class", "pager");
    			add_location(div4, file$g, 176, 12, 7082);
    			attr_dev(section1, "class", "search-result");
    			add_location(section1, file$g, 132, 8, 4858);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$g, 66, 4, 2189);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, h2);
    			append_dev(h2, span);
    			append_dev(span, t0);
    			append_dev(h2, t1);
    			append_dev(div5, t2);
    			append_dev(div5, section0);
    			append_dev(section0, div0);
    			append_dev(div0, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, button0);
    			append_dev(ul0, t4);
    			append_dev(ul0, li1);
    			append_dev(li1, button1);
    			append_dev(ul0, t6);
    			append_dev(ul0, li2);
    			append_dev(li2, button2);
    			append_dev(ul0, t8);
    			append_dev(ul0, li3);
    			append_dev(li3, button3);
    			append_dev(section0, t10);
    			append_dev(section0, div1);
    			append_dev(div1, p);
    			append_dev(p, t11);
    			append_dev(p, t12);
    			append_dev(div1, t13);
    			append_dev(div1, ul1);
    			append_dev(ul1, li4);
    			append_dev(li4, input0);
    			append_dev(li4, t14);
    			append_dev(li4, label0);
    			append_dev(ul1, t16);
    			append_dev(ul1, li5);
    			append_dev(li5, input1);
    			append_dev(li5, t17);
    			append_dev(li5, label1);
    			append_dev(ul1, t19);
    			append_dev(ul1, li6);
    			append_dev(li6, input2);
    			append_dev(li6, t20);
    			append_dev(li6, label2);
    			append_dev(ul1, t22);
    			append_dev(ul1, li7);
    			append_dev(li7, input3);
    			append_dev(li7, t23);
    			append_dev(li7, label3);
    			append_dev(div5, t25);
    			append_dev(div5, section1);
    			append_dev(section1, ul2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul2, null);
    			}

    			append_dev(section1, t26);
    			append_dev(section1, div4);
    			append_dev(div4, div2);
    			append_dev(div2, button4);
    			append_dev(div2, t28);
    			append_dev(div2, button5);
    			append_dev(div4, t30);
    			append_dev(div4, ul3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul3, null);
    			}

    			append_dev(div4, t31);
    			append_dev(div4, div3);
    			append_dev(div3, button6);
    			append_dev(div3, t33);
    			append_dev(div3, button7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[13], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[14], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[15], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[16], false, false, false),
    					listen_dev(input0, "click", /*click_handler_4*/ ctx[17], false, false, false),
    					listen_dev(input1, "click", /*click_handler_5*/ ctx[18], false, false, false),
    					listen_dev(input2, "click", /*click_handler_6*/ ctx[19], false, false, false),
    					listen_dev(input3, "click", /*click_handler_7*/ ctx[20], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*params*/ 1 && t0_value !== (t0_value = /*params*/ ctx[0].keyword + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*checkSort*/ 32 && li0_class_value !== (li0_class_value = /*checkSort*/ ctx[5](0))) {
    				attr_dev(li0, "class", li0_class_value);
    			}

    			if (dirty & /*checkSort*/ 32 && li1_class_value !== (li1_class_value = /*checkSort*/ ctx[5](1))) {
    				attr_dev(li1, "class", li1_class_value);
    			}

    			if (dirty & /*checkSort*/ 32 && li2_class_value !== (li2_class_value = /*checkSort*/ ctx[5](2))) {
    				attr_dev(li2, "class", li2_class_value);
    			}

    			if (dirty & /*checkSort*/ 32 && li3_class_value !== (li3_class_value = /*checkSort*/ ctx[5](3))) {
    				attr_dev(li3, "class", li3_class_value);
    			}

    			if (dirty & /*size*/ 2) set_data_dev(t11, /*size*/ ctx[1]);

    			if (dirty & /*checkSize*/ 64 && li4_class_value !== (li4_class_value = /*checkSize*/ ctx[6](36))) {
    				attr_dev(li4, "class", li4_class_value);
    			}

    			if (dirty & /*checkSize*/ 64 && li5_class_value !== (li5_class_value = /*checkSize*/ ctx[6](48))) {
    				attr_dev(li5, "class", li5_class_value);
    			}

    			if (dirty & /*checkSize*/ 64 && li6_class_value !== (li6_class_value = /*checkSize*/ ctx[6](60))) {
    				attr_dev(li6, "class", li6_class_value);
    			}

    			if (dirty & /*checkSize*/ 64 && li7_class_value !== (li7_class_value = /*checkSize*/ ctx[6](72))) {
    				attr_dev(li7, "class", li7_class_value);
    			}

    			if (dirty & /*products*/ 4) {
    				each_value_1 = /*products*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$5(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$5(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul2, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*checkPage, setPage, pageCount*/ 536) {
    				each_value = Array(/*pageCount*/ ctx[3]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(66:0) {#if products}",
    		ctx
    	});

    	return block;
    }

    // (163:40) {:else}
    function create_else_block$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "리뷰 없음";
    			attr_dev(span, "class", "rating-total-count");
    			add_location(span, file$g, 163, 44, 6567);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(163:40) {:else}",
    		ctx
    	});

    	return block;
    }

    // (152:40) {#if product.rating}
    function create_if_block_1$4(ctx) {
    	let span0;
    	let b;
    	let t0;
    	let span1;
    	let t1_value = /*product*/ ctx[26].reviewCount + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			b = element("b");
    			t0 = space();
    			span1 = element("span");
    			t1 = text(t1_value);
    			t2 = text("개 리뷰");
    			attr_dev(b, "class", "rating");
    			set_style(b, "width", /*product*/ ctx[26].rating * 20 + "%");
    			add_location(b, file$g, 153, 49, 5943);
    			attr_dev(span0, "class", "star");
    			add_location(span0, file$g, 152, 44, 5874);
    			attr_dev(span1, "class", "rating-total-count");
    			add_location(span1, file$g, 159, 44, 6311);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, b);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t1);
    			append_dev(span1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*products*/ 4) {
    				set_style(b, "width", /*product*/ ctx[26].rating * 20 + "%");
    			}

    			if (dirty & /*products*/ 4 && t1_value !== (t1_value = /*product*/ ctx[26].reviewCount + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(152:40) {#if product.rating}",
    		ctx
    	});

    	return block;
    }

    // (135:16) {#each products as product, index}
    function create_each_block_1$5(ctx) {
    	let li;
    	let a;
    	let dl;
    	let dt;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let dd;
    	let h3;
    	let t1_value = /*product*/ ctx[26].name + "";
    	let t1;
    	let t2;
    	let strong;
    	let t3_value = /*product*/ ctx[26].price + "";
    	let t3;
    	let t4;
    	let p;
    	let a_href_value;
    	let t5;

    	function select_block_type(ctx, dirty) {
    		if (/*product*/ ctx[26].rating) return create_if_block_1$4;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			dl = element("dl");
    			dt = element("dt");
    			img = element("img");
    			t0 = space();
    			dd = element("dd");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			strong = element("strong");
    			t3 = text(t3_value);
    			t4 = space();
    			p = element("p");
    			if_block.c();
    			t5 = space();
    			if (!src_url_equal(img.src, img_src_value = /*product*/ ctx[26].thumbnail)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*product*/ ctx[26].name);
    			add_location(img, file$g, 139, 36, 5203);
    			attr_dev(dt, "class", "images");
    			add_location(dt, file$g, 138, 32, 5146);
    			attr_dev(h3, "class", "product-name");
    			add_location(h3, file$g, 146, 36, 5489);
    			attr_dev(strong, "class", "product-price");
    			add_location(strong, file$g, 147, 36, 5571);
    			attr_dev(p, "class", "rating_star");
    			add_location(p, file$g, 150, 36, 5743);
    			add_location(dd, file$g, 145, 32, 5447);
    			add_location(dl, file$g, 137, 28, 5108);
    			attr_dev(a, "href", a_href_value = "#/product/detail/" + /*product*/ ctx[26].productId);
    			add_location(a, file$g, 136, 24, 5031);
    			add_location(li, file$g, 135, 20, 5001);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, dl);
    			append_dev(dl, dt);
    			append_dev(dt, img);
    			append_dev(dt, t0);
    			append_dev(dl, dd);
    			append_dev(dd, h3);
    			append_dev(h3, t1);
    			append_dev(dd, t2);
    			append_dev(dd, strong);
    			append_dev(strong, t3);
    			append_dev(dd, t4);
    			append_dev(dd, p);
    			if_block.m(p, null);
    			append_dev(li, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*products*/ 4 && !src_url_equal(img.src, img_src_value = /*product*/ ctx[26].thumbnail)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*products*/ 4 && img_alt_value !== (img_alt_value = /*product*/ ctx[26].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*products*/ 4 && t1_value !== (t1_value = /*product*/ ctx[26].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*products*/ 4 && t3_value !== (t3_value = /*product*/ ctx[26].price + "")) set_data_dev(t3, t3_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(p, null);
    				}
    			}

    			if (dirty & /*products*/ 4 && a_href_value !== (a_href_value = "#/product/detail/" + /*product*/ ctx[26].productId)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$5.name,
    		type: "each",
    		source: "(135:16) {#each products as product, index}",
    		ctx
    	});

    	return block;
    }

    // (183:20) {#each Array(pageCount) as _, index}
    function create_each_block$6(ctx) {
    	let li;
    	let button;
    	let t0_value = /*index*/ ctx[25] + 1 + "";
    	let t0;
    	let t1;
    	let li_class_value;
    	let mounted;
    	let dispose;

    	function click_handler_8() {
    		return /*click_handler_8*/ ctx[21](/*index*/ ctx[25]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			add_location(button, file$g, 184, 28, 7432);
    			attr_dev(li, "class", li_class_value = /*checkPage*/ ctx[4](/*index*/ ctx[25] + 1));
    			add_location(li, file$g, 183, 24, 7369);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_8, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*checkPage*/ 16 && li_class_value !== (li_class_value = /*checkPage*/ ctx[4](/*index*/ ctx[25] + 1))) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(183:20) {#each Array(pageCount) as _, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let header;
    	let t;
    	let if_block_anchor;
    	let current;
    	header = new Header({ $$inline: true });
    	let if_block = /*products*/ ctx[2] && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*products*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let checkSize;
    	let checkSort;
    	let checkPage;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProductSearch', slots, []);
    	let { params = {} } = $$props;
    	let products;
    	let pageCount;
    	let size;
    	let page;
    	let keyword;
    	let category;
    	let sort;

    	onMount(async () => {
    		$$invalidate(11, category = params.category === '0' ? '' : params.category);
    		const res = await fetch(`${URL$1}/api/v1/product/search/${params.keyword}?` + new URLSearchParams(Object.assign(Object.assign(Object.assign(Object.assign({}, category && { code: category }), page && { page }), size && { size }), sort && { sort })));
    		const jsonBody = await res.json();

    		$$invalidate(2, products = jsonBody.products.map(product => {
    			product.price = product.price.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',') + '원';
    			return product;
    		}));

    		$$invalidate(3, pageCount = jsonBody.pageCount);
    		$$invalidate(1, size = jsonBody.size);
    		$$invalidate(10, page = jsonBody.page);
    		keyword = jsonBody.keyword;
    		$$invalidate(11, category = jsonBody.category);
    		$$invalidate(12, sort = jsonBody.sort);
    	});

    	const setSize = async pageSize => {
    		$$invalidate(1, size = pageSize);
    	};

    	const setSort = pageSort => {
    		$$invalidate(12, sort = pageSort);
    	};

    	const setPage = nowPage => {
    		$$invalidate(10, page = nowPage);
    	};

    	const writable_props = ['params'];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ProductSearch> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => setSort(0);
    	const click_handler_1 = () => setSort(1);
    	const click_handler_2 = () => setSort(2);
    	const click_handler_3 = () => setSort(3);
    	const click_handler_4 = () => setSize(36);
    	const click_handler_5 = () => setSize(48);
    	const click_handler_6 = () => setSize(60);
    	const click_handler_7 = () => setSize(72);
    	const click_handler_8 = index => setPage(index + 1);

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		Header,
    		onMount,
    		URL: URL$1,
    		params,
    		products,
    		pageCount,
    		size,
    		page,
    		keyword,
    		category,
    		sort,
    		setSize,
    		setSort,
    		setPage,
    		checkPage,
    		checkSort,
    		checkSize
    	});

    	$$self.$inject_state = $$props => {
    		if ('params' in $$props) $$invalidate(0, params = $$props.params);
    		if ('products' in $$props) $$invalidate(2, products = $$props.products);
    		if ('pageCount' in $$props) $$invalidate(3, pageCount = $$props.pageCount);
    		if ('size' in $$props) $$invalidate(1, size = $$props.size);
    		if ('page' in $$props) $$invalidate(10, page = $$props.page);
    		if ('keyword' in $$props) keyword = $$props.keyword;
    		if ('category' in $$props) $$invalidate(11, category = $$props.category);
    		if ('sort' in $$props) $$invalidate(12, sort = $$props.sort);
    		if ('checkPage' in $$props) $$invalidate(4, checkPage = $$props.checkPage);
    		if ('checkSort' in $$props) $$invalidate(5, checkSort = $$props.checkSort);
    		if ('checkSize' in $$props) $$invalidate(6, checkSize = $$props.checkSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params, category, page, size, sort*/ 7171) {
    			(async function () {
    				const res = await fetch(`${URL$1}/api/v1/product/search/${params.keyword}?` + new URLSearchParams(Object.assign(Object.assign(Object.assign(Object.assign({}, category && { code: category }), page && { page }), size && { size }), sort && { sort })));
    				const jsonBody = await res.json();

    				$$invalidate(2, products = jsonBody.products.map(product => {
    					product.price = product.price.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',') + '원';
    					return product;
    				}));

    				$$invalidate(3, pageCount = jsonBody.pageCount);
    			})();
    		}

    		if ($$self.$$.dirty & /*size*/ 2) {
    			$$invalidate(6, checkSize = pageSize => {
    				return pageSize === size ? 'active' : '';
    			});
    		}

    		if ($$self.$$.dirty & /*sort*/ 4096) {
    			$$invalidate(5, checkSort = pageSort => {
    				return pageSort === sort ? 'active' : '';
    			});
    		}

    		if ($$self.$$.dirty & /*page*/ 1024) {
    			$$invalidate(4, checkPage = nowPage => {
    				return nowPage === page ? 'active' : '';
    			});
    		}
    	};

    	return [
    		params,
    		size,
    		products,
    		pageCount,
    		checkPage,
    		checkSort,
    		checkSize,
    		setSize,
    		setSort,
    		setPage,
    		page,
    		category,
    		sort,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8
    	];
    }

    class ProductSearch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductSearch",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get params() {
    		throw new Error("<ProductSearch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<ProductSearch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const e=Symbol("@ts-pattern/matcher"),t="@ts-pattern/anonymous-select-key",n=e=>Boolean(e&&"object"==typeof e),r=t=>t&&!!t[e],o=(t,c,a)=>{if(n(t)){if(r(t)){const n=t[e](),{matched:r,selections:o}=n.match(c);return r&&o&&Object.keys(o).forEach(e=>a(e,o[e])),r}if(!n(c))return !1;if(Array.isArray(t))return !!Array.isArray(c)&&t.length===c.length&&t.every((e,t)=>o(e,c[t],a));if(t instanceof Map)return c instanceof Map&&Array.from(t.keys()).every(e=>o(t.get(e),c.get(e),a));if(t instanceof Set){if(!(c instanceof Set))return !1;if(0===t.size)return 0===c.size;if(1===t.size){const[e]=Array.from(t.values());return r(e)?Array.from(c.values()).every(t=>o(e,t,a)):c.has(e)}return Array.from(t.values()).every(e=>c.has(e))}return Object.keys(t).every(n=>{const s=t[n];return (n in c||r(i=s)&&"optional"===i[e]().matcherType)&&o(s,c[n],a);var i;})}return Object.is(c,t)};const K=e=>new O(e,[]);class O{constructor(e,t){this.value=void 0,this.cases=void 0,this.value=e,this.cases=t;}with(...e){const n=e[e.length-1],r=[e[0]],c=[];return 3===e.length&&"function"==typeof e[1]?(r.push(e[0]),c.push(e[1])):e.length>2&&r.push(...e.slice(1,e.length-1)),new O(this.value,this.cases.concat([{match:e=>{let n={};const a=Boolean(r.some(t=>o(t,e,(e,t)=>{n[e]=t;}))&&c.every(t=>t(e)));return {matched:a,value:a&&Object.keys(n).length?t in n?n[t]:n:e}},handler:n}]))}when(e,t){return new O(this.value,this.cases.concat([{match:t=>({matched:Boolean(e(t)),value:t}),handler:t}]))}otherwise(e){return new O(this.value,this.cases.concat([{match:e=>({matched:!0,value:e}),handler:e}])).run()}exhaustive(){return this.run()}run(){let e,t=this.value;for(const n of this.cases){const r=n.match(this.value);if(r.matched){t=r.value,e=n.handler;break}}if(!e){let e;try{e=JSON.stringify(this.value);}catch(t){e=this.value;}throw new Error(`Pattern matching error: no pattern matches value ${e}`)}return e(t,this.value)}}

    /* src\components\product\detail\ProductSection.svelte generated by Svelte v3.48.0 */

    const { Object: Object_1$1 } = globals;
    const file$f = "src\\components\\product\\detail\\ProductSection.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[23] = list;
    	child_ctx[24] = i;
    	return child_ctx;
    }

    function get_each_context_1$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	child_ctx[30] = i;
    	return child_ctx;
    }

    // (57:0) {#if product}
    function create_if_block$7(ctx) {
    	let section;
    	let div7;
    	let article0;
    	let div0;
    	let ul;
    	let t0;
    	let div1;
    	let img;
    	let img_src_value;
    	let t1;
    	let article1;
    	let div2;
    	let h2;
    	let t2_value = /*product*/ ctx[0].name + "";
    	let t2;
    	let t3;
    	let p0;
    	let t4;
    	let div3;
    	let p1;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let div4;
    	let p2;
    	let t10;
    	let input0;
    	let input0_value_value;
    	let t11;
    	let strong;
    	let t12;
    	let t13;
    	let t14;
    	let div6;
    	let div5;
    	let button0;
    	let t16;
    	let input1;
    	let t17;
    	let button1;
    	let t19;
    	let button2;
    	let t21;
    	let button3;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*product*/ ctx[0].imageList;
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2$2(get_each_context_2$2(ctx, each_value_2, i));
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*product*/ ctx[0].rating) return create_if_block_1$3;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	let each_value = /*product*/ ctx[0].optionList;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div7 = element("div");
    			article0 = element("article");
    			div0 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div1 = element("div");
    			img = element("img");
    			t1 = space();
    			article1 = element("article");
    			div2 = element("div");
    			h2 = element("h2");
    			t2 = text(t2_value);
    			t3 = space();
    			p0 = element("p");
    			if_block.c();
    			t4 = space();
    			div3 = element("div");
    			p1 = element("p");
    			t5 = text(/*priceWithComma*/ ctx[5]);
    			t6 = text(" 원");
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			div4 = element("div");
    			p2 = element("p");
    			p2.textContent = "총 상품가격";
    			t10 = space();
    			input0 = element("input");
    			t11 = space();
    			strong = element("strong");
    			t12 = text(/*totPriceWithComma*/ ctx[4]);
    			t13 = text(" 원");
    			t14 = space();
    			div6 = element("div");
    			div5 = element("div");
    			button0 = element("button");
    			button0.textContent = "-";
    			t16 = space();
    			input1 = element("input");
    			t17 = space();
    			button1 = element("button");
    			button1.textContent = "+";
    			t19 = space();
    			button2 = element("button");
    			button2.textContent = "장바구니담기";
    			t21 = space();
    			button3 = element("button");
    			button3.textContent = "구매하기";
    			attr_dev(ul, "class", "svelte-1rkurdr");
    			add_location(ul, file$f, 61, 20, 2756);
    			attr_dev(div0, "class", "thum_img-list");
    			add_location(div0, file$f, 60, 16, 2707);

    			if (!src_url_equal(img.src, img_src_value = /*activeImageIndex*/ ctx[3] == -1
    			? /*product*/ ctx[0].thumbnail
    			: /*product*/ ctx[0]?.imageList[/*activeImageIndex*/ ctx[3]].image)) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-1rkurdr");
    			add_location(img, file$f, 82, 20, 3695);
    			attr_dev(div1, "class", "thum_main-img svelte-1rkurdr");
    			add_location(div1, file$f, 77, 16, 3481);
    			attr_dev(article0, "class", "product_thum svelte-1rkurdr");
    			add_location(article0, file$f, 59, 12, 2659);
    			attr_dev(h2, "class", "product-name svelte-1rkurdr");
    			add_location(h2, file$f, 94, 20, 4137);
    			attr_dev(p0, "class", "rating_star svelte-1rkurdr");
    			add_location(p0, file$f, 95, 20, 4203);
    			attr_dev(div2, "class", "order_tit-box svelte-1rkurdr");
    			add_location(div2, file$f, 93, 16, 4088);
    			attr_dev(p1, "id", "price");
    			add_location(p1, file$f, 113, 20, 4975);
    			attr_dev(div3, "class", "product_price svelte-1rkurdr");
    			add_location(div3, file$f, 112, 16, 4926);
    			add_location(p2, file$f, 142, 20, 6167);
    			attr_dev(input0, "type", "hidden");
    			input0.value = input0_value_value = /*product*/ ctx[0].price;
    			add_location(input0, file$f, 143, 20, 6202);
    			attr_dev(strong, "id", "totPrice");
    			add_location(strong, file$f, 144, 20, 6269);
    			attr_dev(div4, "class", "total-price svelte-1rkurdr");
    			add_location(div4, file$f, 141, 16, 6120);
    			attr_dev(button0, "class", "count_minus-btn svelte-1rkurdr");
    			attr_dev(button0, "id", "sub-quantity");
    			add_location(button0, file$f, 151, 24, 6584);
    			attr_dev(input1, "name", "quantity");
    			attr_dev(input1, "id", "quantity");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "count-number svelte-1rkurdr");
    			add_location(input1, file$f, 156, 24, 6806);
    			attr_dev(button1, "class", "count_plus-btn svelte-1rkurdr");
    			attr_dev(button1, "id", "add-quantity");
    			add_location(button1, file$f, 163, 24, 7098);
    			attr_dev(div5, "class", "order_count svelte-1rkurdr");
    			add_location(div5, file$f, 150, 20, 6533);
    			attr_dev(button2, "class", "add-cart_btn svelte-1rkurdr");
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "id", "add-cart-button");
    			button2.value = "cart";
    			add_location(button2, file$f, 170, 20, 7345);
    			attr_dev(button3, "class", "buy-now_btn svelte-1rkurdr");
    			attr_dev(button3, "type", "button");
    			button3.value = "order";
    			add_location(button3, file$f, 179, 20, 7673);
    			attr_dev(div6, "class", "order-btn-grp svelte-1rkurdr");
    			add_location(div6, file$f, 149, 16, 6484);
    			attr_dev(article1, "class", "product_order svelte-1rkurdr");
    			add_location(article1, file$f, 92, 12, 4039);
    			attr_dev(div7, "class", "inner svelte-1rkurdr");
    			add_location(div7, file$f, 58, 8, 2626);
    			attr_dev(section, "class", "product_top-info svelte-1rkurdr");
    			add_location(section, file$f, 57, 4, 2582);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div7);
    			append_dev(div7, article0);
    			append_dev(article0, div0);
    			append_dev(div0, ul);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul, null);
    			}

    			append_dev(article0, t0);
    			append_dev(article0, div1);
    			append_dev(div1, img);
    			append_dev(div7, t1);
    			append_dev(div7, article1);
    			append_dev(article1, div2);
    			append_dev(div2, h2);
    			append_dev(h2, t2);
    			append_dev(div2, t3);
    			append_dev(div2, p0);
    			if_block.m(p0, null);
    			append_dev(article1, t4);
    			append_dev(article1, div3);
    			append_dev(div3, p1);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    			append_dev(article1, t7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(article1, null);
    			}

    			append_dev(article1, t8);
    			append_dev(article1, div4);
    			append_dev(div4, p2);
    			append_dev(div4, t10);
    			append_dev(div4, input0);
    			append_dev(div4, t11);
    			append_dev(div4, strong);
    			append_dev(strong, t12);
    			append_dev(strong, t13);
    			append_dev(article1, t14);
    			append_dev(article1, div6);
    			append_dev(div6, div5);
    			append_dev(div5, button0);
    			append_dev(div5, t16);
    			append_dev(div5, input1);
    			set_input_value(input1, /*quantity*/ ctx[2]);
    			append_dev(div5, t17);
    			append_dev(div5, button1);
    			append_dev(div6, t19);
    			append_dev(div6, button2);
    			append_dev(div6, t21);
    			append_dev(div6, button3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*subQuantity*/ ctx[7], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[20]),
    					listen_dev(button1, "click", /*addQuantity*/ ctx[6], false, false, false),
    					listen_dev(button2, "click", /*addCart*/ ctx[8], false, false, false),
    					listen_dev(button3, "click", /*click_handler*/ ctx[21], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*activeImageIndex, product*/ 9) {
    				each_value_2 = /*product*/ ctx[0].imageList;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*activeImageIndex, product*/ 9 && !src_url_equal(img.src, img_src_value = /*activeImageIndex*/ ctx[3] == -1
    			? /*product*/ ctx[0].thumbnail
    			: /*product*/ ctx[0]?.imageList[/*activeImageIndex*/ ctx[3]].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*product*/ 1 && t2_value !== (t2_value = /*product*/ ctx[0].name + "")) set_data_dev(t2, t2_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(p0, null);
    				}
    			}

    			if (dirty & /*priceWithComma*/ 32) set_data_dev(t5, /*priceWithComma*/ ctx[5]);

    			if (dirty & /*product, selectedItems*/ 3) {
    				each_value = /*product*/ ctx[0].optionList;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(article1, t8);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*product*/ 1 && input0_value_value !== (input0_value_value = /*product*/ ctx[0].price)) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*totPriceWithComma*/ 16) set_data_dev(t12, /*totPriceWithComma*/ ctx[4]);

    			if (dirty & /*quantity*/ 4 && to_number(input1.value) !== /*quantity*/ ctx[2]) {
    				set_input_value(input1, /*quantity*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks_1, detaching);
    			if_block.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(57:0) {#if product}",
    		ctx
    	});

    	return block;
    }

    // (64:24) {#each product.imageList as image, i}
    function create_each_block_2$2(ctx) {
    	let li;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t;
    	let li_class_value;
    	let mounted;
    	let dispose;

    	function mouseover_handler() {
    		return /*mouseover_handler*/ ctx[17](/*i*/ ctx[30]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			img = element("img");
    			t = space();
    			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[28].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*product*/ ctx[0].name);
    			attr_dev(img, "class", "svelte-1rkurdr");
    			add_location(img, file$f, 65, 32, 2982);

    			attr_dev(li, "class", li_class_value = "" + (null_to_empty(/*i*/ ctx[30] == /*activeImageIndex*/ ctx[3]
    			? 'active'
    			: '') + " svelte-1rkurdr"));

    			add_location(li, file$f, 64, 28, 2898);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, img);
    			append_dev(li, t);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img, "mouseover", mouseover_handler, false, false, false),
    					listen_dev(img, "mouseout", /*mouseout_handler*/ ctx[18], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*product*/ 1 && !src_url_equal(img.src, img_src_value = /*image*/ ctx[28].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*product*/ 1 && img_alt_value !== (img_alt_value = /*product*/ ctx[0].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*activeImageIndex*/ 8 && li_class_value !== (li_class_value = "" + (null_to_empty(/*i*/ ctx[30] == /*activeImageIndex*/ ctx[3]
    			? 'active'
    			: '') + " svelte-1rkurdr"))) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$2.name,
    		type: "each",
    		source: "(64:24) {#each product.imageList as image, i}",
    		ctx
    	});

    	return block;
    }

    // (107:24) {:else}
    function create_else_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "리뷰 없음";
    			attr_dev(span, "class", "rating-total-count svelte-1rkurdr");
    			add_location(span, file$f, 107, 28, 4778);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(107:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (97:24) {#if product.rating}
    function create_if_block_1$3(ctx) {
    	let span0;
    	let b;
    	let t0;
    	let span1;
    	let t1_value = /*product*/ ctx[0].reviewCount + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			b = element("b");
    			t0 = space();
    			span1 = element("span");
    			t1 = text(t1_value);
    			t2 = text("개 리뷰");
    			attr_dev(b, "class", "rating svelte-1rkurdr");
    			set_style(b, "width", /*product*/ ctx[0].rating * 20 + "%");
    			add_location(b, file$f, 98, 32, 4355);
    			attr_dev(span0, "class", "star svelte-1rkurdr");
    			add_location(span0, file$f, 97, 28, 4302);
    			attr_dev(span1, "class", "rating-total-count svelte-1rkurdr");
    			add_location(span1, file$f, 103, 28, 4586);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, b);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t1);
    			append_dev(span1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*product*/ 1) {
    				set_style(b, "width", /*product*/ ctx[0].rating * 20 + "%");
    			}

    			if (dirty & /*product*/ 1 && t1_value !== (t1_value = /*product*/ ctx[0].reviewCount + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(97:24) {#if product.rating}",
    		ctx
    	});

    	return block;
    }

    // (128:32) {#each option.itemList as item}
    function create_each_block_1$4(ctx) {
    	let option;
    	let t_value = /*item*/ ctx[25].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*item*/ ctx[25].productOptionItemId;
    			option.value = option.__value;
    			add_location(option, file$f, 128, 36, 5680);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*product*/ 1 && t_value !== (t_value = /*item*/ ctx[25].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*product*/ 1 && option_value_value !== (option_value_value = /*item*/ ctx[25].productOptionItemId)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$4.name,
    		type: "each",
    		source: "(128:32) {#each option.itemList as item}",
    		ctx
    	});

    	return block;
    }

    // (119:16) {#each product.optionList as option, index}
    function create_each_block$5(ctx) {
    	let div1;
    	let div0;
    	let p;
    	let t0_value = /*option*/ ctx[22].name + "";
    	let t0;
    	let t1;
    	let select;
    	let select_name_value;
    	let t2;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*option*/ ctx[22].itemList;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$4(get_each_context_1$4(ctx, each_value_1, i));
    	}

    	function select_change_handler() {
    		/*select_change_handler*/ ctx[19].call(select, /*index*/ ctx[24]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(p, "class", "option-name");
    			add_location(p, file$f, 121, 28, 5281);
    			attr_dev(select, "name", select_name_value = /*option*/ ctx[22].productOptionId);
    			attr_dev(select, "class", "svelte-1rkurdr");
    			if (/*selectedItems*/ ctx[1][/*index*/ ctx[24]] === void 0) add_render_callback(select_change_handler);
    			add_location(select, file$f, 123, 28, 5409);
    			attr_dev(div0, "class", "option svelte-1rkurdr");
    			add_location(div0, file$f, 120, 24, 5231);
    			attr_dev(div1, "class", "product_option-box svelte-1rkurdr");
    			add_location(div1, file$f, 119, 20, 5173);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div0, t1);
    			append_dev(div0, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectedItems*/ ctx[1][/*index*/ ctx[24]]);
    			append_dev(div1, t2);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", select_change_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*product*/ 1 && t0_value !== (t0_value = /*option*/ ctx[22].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*product*/ 1) {
    				each_value_1 = /*option*/ ctx[22].itemList;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$4(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*product*/ 1 && select_name_value !== (select_name_value = /*option*/ ctx[22].productOptionId)) {
    				attr_dev(select, "name", select_name_value);
    			}

    			if (dirty & /*selectedItems, product*/ 3) {
    				select_option(select, /*selectedItems*/ ctx[1][/*index*/ ctx[24]]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(119:16) {#each product.optionList as option, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let if_block_anchor;
    	let if_block = /*product*/ ctx[0] && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*product*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let priceWithComma;
    	let surcharges;
    	let surcharge;
    	let totPrice;
    	let totPriceWithComma;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProductSection', slots, []);
    	var _a, _b, _c;
    	let { productId } = $$props;
    	let { product } = $$props;
    	let items;

    	onMount(async () => {
    		const res = await fetch(`${URL$1}/api/v1/product/${productId}`);
    		$$invalidate(0, product = await res.json());
    		$$invalidate(13, items = product.optionList.map(option => option.itemList).flat());
    	});

    	let selectedItems = [];
    	let quantity = 1;

    	const addQuantity = () => {
    		$$invalidate(2, quantity += 1);
    	};

    	const subQuantity = () => {
    		if (quantity > 1) $$invalidate(2, quantity -= 1);
    	};

    	const addCart = async () => {
    		const userId = localStorage.getItem('userId');
    		const token = localStorage.getItem('token');

    		if (!userId || !token) {
    			alert('로그인 후 이용 가능합니다.');
    			return;
    		}

    		const res = await fetch(`${URL$1}/api/v1/user/${userId}/cart`, {
    			method: 'POST',
    			headers: Object.assign({ 'Content-Type': 'application/json' }, token && { Authorization: token }),
    			body: JSON.stringify(Object.assign(Object.assign({}, userId && { userId }), {
    				productId: Number(productId),
    				quantity,
    				itemList: selectedItems
    			}))
    		});

    		K(res).with({ status: 201 }, () => alert('상품이 장바구니에 담겼습니다.')).with({ status: 400 }, () => alert('상품을 장바구니에 담지 못했습니다.')).with({ status: 403 }, async () => {
    			const jsonBody = await res.json();
    			alert(`상품의 재고가 부족합니다!(남은 재고: ${jsonBody.stock})`);
    		}).with({ status: 409 }, () => alert('상품을 장바구니에 담지 못했습니다.')).exhaustive();
    	};

    	let activeImageIndex = -1;
    	const writable_props = ['productId', 'product'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ProductSection> was created with unknown prop '${key}'`);
    	});

    	const mouseover_handler = i => $$invalidate(3, activeImageIndex = i);
    	const mouseout_handler = () => $$invalidate(3, activeImageIndex = -1);

    	function select_change_handler(index) {
    		selectedItems[index] = select_value(this);
    		$$invalidate(1, selectedItems);
    		$$invalidate(0, product);
    	}

    	function input1_input_handler() {
    		quantity = to_number(this.value);
    		$$invalidate(2, quantity);
    	}

    	const click_handler = () => alert('구매는 장바구니를 통해서만 가능합니다.');

    	$$self.$$set = $$props => {
    		if ('productId' in $$props) $$invalidate(9, productId = $$props.productId);
    		if ('product' in $$props) $$invalidate(0, product = $$props.product);
    	};

    	$$self.$capture_state = () => ({
    		_a,
    		_b,
    		_c,
    		onMount,
    		match: K,
    		URL: URL$1,
    		productId,
    		product,
    		items,
    		selectedItems,
    		quantity,
    		addQuantity,
    		subQuantity,
    		addCart,
    		activeImageIndex,
    		totPrice,
    		totPriceWithComma,
    		surcharge,
    		surcharges,
    		priceWithComma
    	});

    	$$self.$inject_state = $$props => {
    		if ('_a' in $$props) $$invalidate(10, _a = $$props._a);
    		if ('_b' in $$props) $$invalidate(11, _b = $$props._b);
    		if ('_c' in $$props) $$invalidate(12, _c = $$props._c);
    		if ('productId' in $$props) $$invalidate(9, productId = $$props.productId);
    		if ('product' in $$props) $$invalidate(0, product = $$props.product);
    		if ('items' in $$props) $$invalidate(13, items = $$props.items);
    		if ('selectedItems' in $$props) $$invalidate(1, selectedItems = $$props.selectedItems);
    		if ('quantity' in $$props) $$invalidate(2, quantity = $$props.quantity);
    		if ('activeImageIndex' in $$props) $$invalidate(3, activeImageIndex = $$props.activeImageIndex);
    		if ('totPrice' in $$props) $$invalidate(14, totPrice = $$props.totPrice);
    		if ('totPriceWithComma' in $$props) $$invalidate(4, totPriceWithComma = $$props.totPriceWithComma);
    		if ('surcharge' in $$props) $$invalidate(15, surcharge = $$props.surcharge);
    		if ('surcharges' in $$props) $$invalidate(16, surcharges = $$props.surcharges);
    		if ('priceWithComma' in $$props) $$invalidate(5, priceWithComma = $$props.priceWithComma);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*product, _a, _b*/ 3073) {
    			$$invalidate(5, priceWithComma = $$invalidate(11, _b = $$invalidate(10, _a = product === null || product === void 0
    			? void 0
    			: product.price) === null || _a === void 0
    			? void 0
    			: _a.toString()) === null || _b === void 0
    			? void 0
    			: _b.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ','));
    		}

    		if ($$self.$$.dirty & /*selectedItems, items*/ 8194) {
    			$$invalidate(16, surcharges = selectedItems === null || selectedItems === void 0
    			? void 0
    			: selectedItems.map(itemId => {
    					const temp = items.find(item => item.productOptionItemId === itemId);
    					const surcharge = temp.surcharge;
    					return surcharge;
    				}));
    		}

    		if ($$self.$$.dirty & /*surcharges*/ 65536) {
    			$$invalidate(15, surcharge = (surcharges === null || surcharges === void 0
    			? void 0
    			: surcharges.length) === 0
    			? 0
    			: surcharges.reduce((acc, x) => acc + x));
    		}

    		if ($$self.$$.dirty & /*product, surcharge, quantity*/ 32773) {
    			$$invalidate(14, totPrice = ((product === null || product === void 0
    			? void 0
    			: product.price) + surcharge) * quantity);
    		}

    		if ($$self.$$.dirty & /*totPrice, _c*/ 20480) {
    			$$invalidate(4, totPriceWithComma = $$invalidate(12, _c = totPrice === null || totPrice === void 0
    			? void 0
    			: totPrice.toString()) === null || _c === void 0
    			? void 0
    			: _c.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ','));
    		}
    	};

    	return [
    		product,
    		selectedItems,
    		quantity,
    		activeImageIndex,
    		totPriceWithComma,
    		priceWithComma,
    		addQuantity,
    		subQuantity,
    		addCart,
    		productId,
    		_a,
    		_b,
    		_c,
    		items,
    		totPrice,
    		surcharge,
    		surcharges,
    		mouseover_handler,
    		mouseout_handler,
    		select_change_handler,
    		input1_input_handler,
    		click_handler
    	];
    }

    class ProductSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { productId: 9, product: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductSection",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*productId*/ ctx[9] === undefined && !('productId' in props)) {
    			console.warn("<ProductSection> was created without expected prop 'productId'");
    		}

    		if (/*product*/ ctx[0] === undefined && !('product' in props)) {
    			console.warn("<ProductSection> was created without expected prop 'product'");
    		}
    	}

    	get productId() {
    		throw new Error("<ProductSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set productId(value) {
    		throw new Error("<ProductSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get product() {
    		throw new Error("<ProductSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set product(value) {
    		throw new Error("<ProductSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\product\detail\ReviewSection.svelte generated by Svelte v3.48.0 */
    const file$e = "src\\components\\product\\detail\\ReviewSection.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	child_ctx[37] = i;
    	return child_ctx;
    }

    function get_each_context_1$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	child_ctx[37] = i;
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[39] = list[i];
    	child_ctx[37] = i;
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[39] = list[i];
    	child_ctx[42] = i;
    	return child_ctx;
    }

    function get_each_context_4$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	return child_ctx;
    }

    // (130:0) {#if reviews}
    function create_if_block$6(ctx) {
    	let section;
    	let div0;
    	let h2;
    	let t1;
    	let p;
    	let t3;
    	let button0;
    	let t5;
    	let t6;
    	let div1;
    	let t7;
    	let div4;
    	let div2;
    	let button1;
    	let t9;
    	let ul;
    	let t10;
    	let div3;
    	let button2;
    	let mounted;
    	let dispose;
    	let if_block = /*reviewWrite*/ ctx[7] && create_if_block_2$2(ctx);
    	let each_value_1 = /*reviews*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
    	}

    	let each_value = Array(/*pageCount*/ ctx[4]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "상품평";
    			t1 = space();
    			p = element("p");
    			p.textContent = "- 상품을 구매한 다른 사람들의 리뷰를 살펴보세요";
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "리뷰쓰기";
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t7 = space();
    			div4 = element("div");
    			div2 = element("div");
    			button1 = element("button");
    			button1.textContent = "<";
    			t9 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			div3 = element("div");
    			button2 = element("button");
    			button2.textContent = ">";
    			attr_dev(h2, "class", "section-tit");
    			add_location(h2, file$e, 132, 12, 3973);
    			attr_dev(p, "class", "section-tit-des");
    			add_location(p, file$e, 133, 12, 4019);
    			attr_dev(button0, "class", "review-write-btn");
    			add_location(button0, file$e, 136, 12, 4123);
    			attr_dev(div0, "class", "tit-box");
    			add_location(div0, file$e, 131, 8, 3938);
    			attr_dev(div1, "class", "review-grp");
    			add_location(div1, file$e, 280, 8, 11085);
    			add_location(button1, file$e, 373, 16, 15505);
    			attr_dev(div2, "class", "btn-grp prev-btn");
    			add_location(div2, file$e, 372, 12, 15457);
    			add_location(ul, file$e, 375, 12, 15579);
    			add_location(button2, file$e, 385, 16, 15942);
    			attr_dev(div3, "class", "btn-grp next-btn");
    			add_location(div3, file$e, 384, 12, 15894);
    			attr_dev(div4, "class", "pager");
    			add_location(div4, file$e, 371, 8, 15424);
    			attr_dev(section, "class", "product-review");
    			attr_dev(section, "id", "review");
    			add_location(section, file$e, 130, 4, 3865);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(div0, t3);
    			append_dev(div0, button0);
    			append_dev(section, t5);
    			if (if_block) if_block.m(section, null);
    			append_dev(section, t6);
    			append_dev(section, div1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(section, t7);
    			append_dev(section, div4);
    			append_dev(div4, div2);
    			append_dev(div2, button1);
    			append_dev(div4, t9);
    			append_dev(div4, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div4, t10);
    			append_dev(div4, div3);
    			append_dev(div3, button2);
    			/*section_binding*/ ctx[33](section);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*writeReviewCheck*/ ctx[15], false, false, false),
    					listen_dev(button1, "click", /*subPage*/ ctx[14], false, false, false),
    					listen_dev(button2, "click", /*addPage*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*reviewWrite*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$2(ctx);
    					if_block.c();
    					if_block.m(section, t6);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*reviews, currentDetailImage, reviewDetailsShown*/ 104) {
    				each_value_1 = /*reviews*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*setPage, pageCount*/ 4112) {
    				each_value = Array(/*pageCount*/ ctx[4]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			/*section_binding*/ ctx[33](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(130:0) {#if reviews}",
    		ctx
    	});

    	return block;
    }

    // (142:8) {#if reviewWrite}
    function create_if_block_2$2(ctx) {
    	let div7;
    	let div6;
    	let h2;
    	let t1;
    	let div5;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t2;
    	let h30;
    	let t3_value = /*product*/ ctx[1].name + "";
    	let t3;
    	let t4;
    	let p;
    	let t5;
    	let form;
    	let fieldset0;
    	let legend0;
    	let t7;
    	let h31;
    	let t9;
    	let div2;
    	let input0;
    	let label0;
    	let t11;
    	let input1;
    	let t12;
    	let label1;
    	let t14;
    	let input2;
    	let label2;
    	let t16;
    	let input3;
    	let label3;
    	let t18;
    	let input4;
    	let label4;
    	let t20;
    	let fieldset1;
    	let legend1;
    	let t22;
    	let label5;
    	let h32;
    	let t24;
    	let input5;
    	let t25;
    	let label6;
    	let h33;
    	let t27;
    	let textarea;
    	let t28;
    	let fieldset2;
    	let legend2;
    	let t30;
    	let div3;
    	let label7;
    	let t32;
    	let input6;
    	let t33;
    	let ul;
    	let t34;
    	let div4;
    	let button0;
    	let t36;
    	let button1;
    	let mounted;
    	let dispose;
    	let each_value_4 = /*reviewProductInfo*/ ctx[8].details;
    	validate_each_argument(each_value_4);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_1[i] = create_each_block_4$1(get_each_context_4$1(ctx, each_value_4, i));
    	}

    	let each_value_3 = /*images*/ ctx[2];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			h2 = element("h2");
    			h2.textContent = "리뷰 작성하기";
    			t1 = space();
    			div5 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t2 = space();
    			h30 = element("h3");
    			t3 = text(t3_value);
    			t4 = space();
    			p = element("p");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			form = element("form");
    			fieldset0 = element("fieldset");
    			legend0 = element("legend");
    			legend0.textContent = "별점주기";
    			t7 = space();
    			h31 = element("h3");
    			h31.textContent = "상품은 괜찮았나요?";
    			t9 = space();
    			div2 = element("div");
    			input0 = element("input");
    			label0 = element("label");
    			label0.textContent = "5점";
    			t11 = space();
    			input1 = element("input");
    			t12 = space();
    			label1 = element("label");
    			label1.textContent = "4점";
    			t14 = space();
    			input2 = element("input");
    			label2 = element("label");
    			label2.textContent = "3점";
    			t16 = space();
    			input3 = element("input");
    			label3 = element("label");
    			label3.textContent = "2점";
    			t18 = space();
    			input4 = element("input");
    			label4 = element("label");
    			label4.textContent = "1점";
    			t20 = space();
    			fieldset1 = element("fieldset");
    			legend1 = element("legend");
    			legend1.textContent = "리뷰 내용 작성";
    			t22 = space();
    			label5 = element("label");
    			h32 = element("h3");
    			h32.textContent = "제목";
    			t24 = space();
    			input5 = element("input");
    			t25 = space();
    			label6 = element("label");
    			h33 = element("h3");
    			h33.textContent = "내용";
    			t27 = space();
    			textarea = element("textarea");
    			t28 = space();
    			fieldset2 = element("fieldset");
    			legend2 = element("legend");
    			legend2.textContent = "리뷰 사진 등록";
    			t30 = space();
    			div3 = element("div");
    			label7 = element("label");
    			label7.textContent = "사진 첨부하기 +";
    			t32 = space();
    			input6 = element("input");
    			t33 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t34 = space();
    			div4 = element("div");
    			button0 = element("button");
    			button0.textContent = "취소";
    			t36 = space();
    			button1 = element("button");
    			button1.textContent = "등록";
    			attr_dev(h2, "class", "form-title");
    			add_location(h2, file$e, 145, 20, 4408);
    			if (!src_url_equal(img.src, img_src_value = /*product*/ ctx[1].thumbnail)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "임시 썸네일");
    			add_location(img, file$e, 149, 32, 4637);
    			attr_dev(div0, "class", "product-thum");
    			add_location(div0, file$e, 148, 28, 4577);
    			attr_dev(p, "class", "option-name");
    			add_location(p, file$e, 156, 32, 4961);
    			attr_dev(h30, "class", "product-name");
    			add_location(h30, file$e, 154, 28, 4854);
    			attr_dev(div1, "class", "product-info");
    			add_location(div1, file$e, 147, 24, 4521);
    			add_location(legend0, file$e, 166, 32, 5429);
    			attr_dev(h31, "class", "stars-title");
    			add_location(h31, file$e, 168, 32, 5486);
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "id", "star_5");
    			input0.__value = 5;
    			input0.value = input0.__value;
    			attr_dev(input0, "name", "star-rating");
    			/*$$binding_groups*/ ctx[20][0].push(input0);
    			add_location(input0, file$e, 170, 36, 5616);
    			attr_dev(label0, "for", "star_5");
    			add_location(label0, file$e, 176, 38, 5941);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "id", "star_4");
    			input1.__value = 4;
    			input1.value = input1.__value;
    			attr_dev(input1, "name", "star-rating");
    			/*$$binding_groups*/ ctx[20][0].push(input1);
    			add_location(input1, file$e, 177, 36, 6009);
    			attr_dev(label1, "for", "star_4");
    			add_location(label1, file$e, 184, 36, 6372);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "id", "star_3");
    			input2.__value = 3;
    			input2.value = input2.__value;
    			attr_dev(input2, "name", "star-rating");
    			/*$$binding_groups*/ ctx[20][0].push(input2);
    			add_location(input2, file$e, 185, 36, 6440);
    			attr_dev(label2, "for", "star_3");
    			add_location(label2, file$e, 191, 38, 6765);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "id", "star_2");
    			input3.__value = 2;
    			input3.value = input3.__value;
    			attr_dev(input3, "name", "star-rating");
    			/*$$binding_groups*/ ctx[20][0].push(input3);
    			add_location(input3, file$e, 192, 36, 6833);
    			attr_dev(label3, "for", "star_2");
    			add_location(label3, file$e, 198, 38, 7158);
    			attr_dev(input4, "type", "radio");
    			attr_dev(input4, "id", "star_1");
    			input4.__value = 1;
    			input4.value = input4.__value;
    			attr_dev(input4, "name", "star-rating");
    			/*$$binding_groups*/ ctx[20][0].push(input4);
    			add_location(input4, file$e, 200, 36, 7228);
    			attr_dev(label4, "for", "star_1");
    			add_location(label4, file$e, 206, 38, 7553);
    			attr_dev(div2, "class", "stars");
    			add_location(div2, file$e, 169, 32, 5559);
    			attr_dev(fieldset0, "class", "star_rating");
    			add_location(fieldset0, file$e, 165, 28, 5365);
    			add_location(legend1, file$e, 211, 32, 7764);
    			attr_dev(h32, "class", "input-name");
    			add_location(h32, file$e, 213, 36, 7868);
    			attr_dev(input5, "type", "text");
    			attr_dev(input5, "name", "review-title");
    			input5.required = true;
    			attr_dev(input5, "placeholder", "20글자 이내로 제목을 작성해 주세요");
    			attr_dev(input5, "maxlength", "20");
    			add_location(input5, file$e, 214, 36, 7936);
    			add_location(label5, file$e, 212, 32, 7823);
    			attr_dev(h33, "class", "input-name");
    			add_location(h33, file$e, 225, 36, 8461);
    			attr_dev(textarea, "name", "review-context");
    			textarea.required = true;
    			attr_dev(textarea, "placeholder", "리뷰를 적어주세요!");
    			add_location(textarea, file$e, 226, 36, 8529);
    			add_location(label6, file$e, 224, 32, 8416);
    			attr_dev(fieldset1, "class", "write-my-review");
    			add_location(fieldset1, file$e, 210, 28, 7696);
    			add_location(legend2, file$e, 236, 32, 8999);
    			attr_dev(label7, "for", "uploadPhoto");
    			add_location(label7, file$e, 238, 36, 9119);
    			attr_dev(input6, "type", "file");
    			attr_dev(input6, "name", "review-images");
    			attr_dev(input6, "accept", ".jpg,.png,.jpeg");
    			input6.multiple = true;
    			attr_dev(input6, "id", "uploadPhoto");
    			add_location(input6, file$e, 241, 36, 9279);
    			attr_dev(div3, "class", "add-photo");
    			add_location(div3, file$e, 237, 32, 9058);
    			add_location(ul, file$e, 250, 32, 9766);
    			attr_dev(fieldset2, "class", "upload-photo");
    			add_location(fieldset2, file$e, 235, 28, 8934);
    			attr_dev(button0, "class", "close-btn");
    			add_location(button0, file$e, 258, 32, 10216);
    			attr_dev(button1, "class", "review-submit-btn");
    			add_location(button1, file$e, 267, 32, 10641);
    			attr_dev(div4, "class", "form-btn-wrap");
    			add_location(div4, file$e, 257, 28, 10155);
    			attr_dev(form, "action", "#");
    			attr_dev(form, "method", "post");
    			add_location(form, file$e, 164, 24, 5304);
    			attr_dev(div5, "class", "review-form-wrap");
    			add_location(div5, file$e, 146, 20, 4465);
    			attr_dev(div6, "class", "write-review");
    			add_location(div6, file$e, 144, 16, 4360);
    			attr_dev(div7, "class", "review-layer");
    			add_location(div7, file$e, 143, 12, 4316);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, h2);
    			append_dev(div6, t1);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t2);
    			append_dev(div1, h30);
    			append_dev(h30, t3);
    			append_dev(h30, t4);
    			append_dev(h30, p);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(p, null);
    			}

    			append_dev(div5, t5);
    			append_dev(div5, form);
    			append_dev(form, fieldset0);
    			append_dev(fieldset0, legend0);
    			append_dev(fieldset0, t7);
    			append_dev(fieldset0, h31);
    			append_dev(fieldset0, t9);
    			append_dev(fieldset0, div2);
    			append_dev(div2, input0);
    			input0.checked = input0.__value === /*rating*/ ctx[9];
    			append_dev(div2, label0);
    			append_dev(div2, t11);
    			append_dev(div2, input1);
    			input1.checked = input1.__value === /*rating*/ ctx[9];
    			append_dev(div2, t12);
    			append_dev(div2, label1);
    			append_dev(div2, t14);
    			append_dev(div2, input2);
    			input2.checked = input2.__value === /*rating*/ ctx[9];
    			append_dev(div2, label2);
    			append_dev(div2, t16);
    			append_dev(div2, input3);
    			input3.checked = input3.__value === /*rating*/ ctx[9];
    			append_dev(div2, label3);
    			append_dev(div2, t18);
    			append_dev(div2, input4);
    			input4.checked = input4.__value === /*rating*/ ctx[9];
    			append_dev(div2, label4);
    			append_dev(form, t20);
    			append_dev(form, fieldset1);
    			append_dev(fieldset1, legend1);
    			append_dev(fieldset1, t22);
    			append_dev(fieldset1, label5);
    			append_dev(label5, h32);
    			append_dev(label5, t24);
    			append_dev(label5, input5);
    			set_input_value(input5, /*title*/ ctx[10]);
    			append_dev(fieldset1, t25);
    			append_dev(fieldset1, label6);
    			append_dev(label6, h33);
    			append_dev(label6, t27);
    			append_dev(label6, textarea);
    			set_input_value(textarea, /*content*/ ctx[11]);
    			append_dev(form, t28);
    			append_dev(form, fieldset2);
    			append_dev(fieldset2, legend2);
    			append_dev(fieldset2, t30);
    			append_dev(fieldset2, div3);
    			append_dev(div3, label7);
    			append_dev(div3, t32);
    			append_dev(div3, input6);
    			append_dev(fieldset2, t33);
    			append_dev(fieldset2, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(form, t34);
    			append_dev(form, div4);
    			append_dev(div4, button0);
    			append_dev(div4, t36);
    			append_dev(div4, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[19]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[21]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[22]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[23]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[24]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[25]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[26]),
    					listen_dev(input6, "change", /*change_handler*/ ctx[27], false, false, false),
    					listen_dev(button0, "click", /*click_handler*/ ctx[28], false, false, false),
    					listen_dev(button1, "click", /*writeReview*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*product*/ 2 && !src_url_equal(img.src, img_src_value = /*product*/ ctx[1].thumbnail)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*product*/ 2 && t3_value !== (t3_value = /*product*/ ctx[1].name + "")) set_data_dev(t3, t3_value);

    			if (dirty[0] & /*reviewProductInfo*/ 256) {
    				each_value_4 = /*reviewProductInfo*/ ctx[8].details;
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4$1(ctx, each_value_4, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_4$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(p, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_4.length;
    			}

    			if (dirty[0] & /*rating*/ 512) {
    				input0.checked = input0.__value === /*rating*/ ctx[9];
    			}

    			if (dirty[0] & /*rating*/ 512) {
    				input1.checked = input1.__value === /*rating*/ ctx[9];
    			}

    			if (dirty[0] & /*rating*/ 512) {
    				input2.checked = input2.__value === /*rating*/ ctx[9];
    			}

    			if (dirty[0] & /*rating*/ 512) {
    				input3.checked = input3.__value === /*rating*/ ctx[9];
    			}

    			if (dirty[0] & /*rating*/ 512) {
    				input4.checked = input4.__value === /*rating*/ ctx[9];
    			}

    			if (dirty[0] & /*title*/ 1024 && input5.value !== /*title*/ ctx[10]) {
    				set_input_value(input5, /*title*/ ctx[10]);
    			}

    			if (dirty[0] & /*content*/ 2048) {
    				set_input_value(textarea, /*content*/ ctx[11]);
    			}

    			if (dirty[0] & /*images*/ 4) {
    				each_value_3 = /*images*/ ctx[2];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_each(each_blocks_1, detaching);
    			/*$$binding_groups*/ ctx[20][0].splice(/*$$binding_groups*/ ctx[20][0].indexOf(input0), 1);
    			/*$$binding_groups*/ ctx[20][0].splice(/*$$binding_groups*/ ctx[20][0].indexOf(input1), 1);
    			/*$$binding_groups*/ ctx[20][0].splice(/*$$binding_groups*/ ctx[20][0].indexOf(input2), 1);
    			/*$$binding_groups*/ ctx[20][0].splice(/*$$binding_groups*/ ctx[20][0].indexOf(input3), 1);
    			/*$$binding_groups*/ ctx[20][0].splice(/*$$binding_groups*/ ctx[20][0].indexOf(input4), 1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(142:8) {#if reviewWrite}",
    		ctx
    	});

    	return block;
    }

    // (158:36) {#each reviewProductInfo.details as detail}
    function create_each_block_4$1(ctx) {
    	let t_value = /*detail*/ ctx[43].name + ' ' + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*reviewProductInfo*/ 256 && t_value !== (t_value = /*detail*/ ctx[43].name + ' ' + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4$1.name,
    		type: "each",
    		source: "(158:36) {#each reviewProductInfo.details as detail}",
    		ctx
    	});

    	return block;
    }

    // (253:36) {#each images as image, idx}
    function create_each_block_3$1(ctx) {
    	let li;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[39])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*idx*/ ctx[42]);
    			add_location(img, file$e, 253, 44, 9966);
    			add_location(li, file$e, 253, 40, 9962);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*images*/ 4 && !src_url_equal(img.src, img_src_value = /*image*/ ctx[39])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(253:36) {#each images as image, idx}",
    		ctx
    	});

    	return block;
    }

    // (336:20) {#if reviewDetailsShown[index]}
    function create_if_block_1$2(ctx) {
    	let div3;
    	let div2;
    	let button;
    	let t0;
    	let h2;
    	let t1_value = /*review*/ ctx[0].title + "";
    	let t1;
    	let t2;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t3;
    	let ul;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[30](/*index*/ ctx[37]);
    	}

    	let each_value_2 = /*review*/ ctx[0].images;
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			button = element("button");
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t3 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(button, "class", "close-btn");
    			add_location(button, file$e, 338, 32, 13733);
    			attr_dev(h2, "class", "section-tit");
    			add_location(h2, file$e, 343, 32, 13996);
    			if (!src_url_equal(img.src, img_src_value = /*currentDetailImage*/ ctx[6])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "1");
    			add_location(img, file$e, 347, 40, 14296);
    			attr_dev(div0, "class", "now-photo");
    			add_location(div0, file$e, 345, 36, 14134);
    			add_location(ul, file$e, 349, 36, 14418);
    			attr_dev(div1, "class", "photo-box");
    			add_location(div1, file$e, 344, 32, 14073);
    			attr_dev(div2, "class", "content-box");
    			add_location(div2, file$e, 337, 28, 13674);
    			attr_dev(div3, "class", "review-detail");
    			add_location(div3, file$e, 336, 24, 13617);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			append_dev(div2, t0);
    			append_dev(div2, h2);
    			append_dev(h2, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t3);
    			append_dev(div1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*reviews*/ 8 && t1_value !== (t1_value = /*review*/ ctx[0].title + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*currentDetailImage*/ 64 && !src_url_equal(img.src, img_src_value = /*currentDetailImage*/ ctx[6])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*reviews, currentDetailImage*/ 72) {
    				each_value_2 = /*review*/ ctx[0].images;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(336:20) {#if reviewDetailsShown[index]}",
    		ctx
    	});

    	return block;
    }

    // (351:40) {#each review.images as image, index}
    function create_each_block_2$1(ctx) {
    	let li;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[31](/*image*/ ctx[39]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			img = element("img");
    			t = space();
    			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[39].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*image*/ ctx[39].sequence);
    			add_location(img, file$e, 352, 48, 14601);
    			add_location(li, file$e, 351, 44, 14547);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, img);
    			append_dev(li, t);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*reviews*/ 8 && !src_url_equal(img.src, img_src_value = /*image*/ ctx[39].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*reviews*/ 8 && img_alt_value !== (img_alt_value = /*image*/ ctx[39].sequence)) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(351:40) {#each review.images as image, index}",
    		ctx
    	});

    	return block;
    }

    // (282:12) {#each reviews as review, index}
    function create_each_block_1$3(ctx) {
    	let article;
    	let div1;
    	let h3;
    	let t0_value = /*review*/ ctx[0].title + "";
    	let t0;
    	let t1;
    	let div0;
    	let p0;
    	let span0;
    	let t2;
    	let span1;
    	let t3_value = /*review*/ ctx[0].name + "";
    	let t3;
    	let t4;
    	let span2;
    	let t5_value = /*review*/ ctx[0].reviewDate + "";
    	let t5;
    	let t6;
    	let div5;
    	let div3;
    	let p1;
    	let t7_value = /*review*/ ctx[0].content + "";
    	let t7;
    	let t8;
    	let div2;
    	let a;
    	let t10;
    	let div4;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t11;
    	let t12;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[29](/*index*/ ctx[37], /*review*/ ctx[0]);
    	}

    	let if_block = /*reviewDetailsShown*/ ctx[5][/*index*/ ctx[37]] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			article = element("article");
    			div1 = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			span0 = element("span");
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			span2 = element("span");
    			t5 = text(t5_value);
    			t6 = space();
    			div5 = element("div");
    			div3 = element("div");
    			p1 = element("p");
    			t7 = text(t7_value);
    			t8 = space();
    			div2 = element("div");
    			a = element("a");
    			a.textContent = "리뷰 내용 더보기 >>";
    			t10 = space();
    			div4 = element("div");
    			img = element("img");
    			t11 = space();
    			if (if_block) if_block.c();
    			t12 = space();
    			attr_dev(h3, "class", "review_tit");
    			add_location(h3, file$e, 284, 24, 11278);
    			attr_dev(span0, "class", "star_rating");
    			set_style(span0, "width", /*review*/ ctx[0].rating * 20 + "%");
    			add_location(span0, file$e, 288, 32, 11509);
    			attr_dev(p0, "class", "review_stars");
    			add_location(p0, file$e, 287, 28, 11451);
    			attr_dev(span1, "class", "review_product-info");
    			add_location(span1, file$e, 294, 28, 11794);
    			attr_dev(span2, "class", "review_writing-time");
    			add_location(span2, file$e, 297, 28, 11942);
    			attr_dev(div0, "class", "review_info");
    			add_location(div0, file$e, 285, 24, 11346);
    			attr_dev(div1, "class", "review_top-box");
    			add_location(div1, file$e, 283, 20, 11224);
    			add_location(p1, file$e, 305, 28, 12258);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "read-more-btn");
    			add_location(a, file$e, 309, 32, 12439);
    			attr_dev(div2, "class", "review_btn-group");
    			add_location(div2, file$e, 308, 28, 12375);
    			attr_dev(div3, "class", "review_txt");
    			add_location(div3, file$e, 304, 24, 12204);
    			if (!src_url_equal(img.src, img_src_value = /*review*/ ctx[0].images[0]?.image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*review*/ ctx[0].images[0]?.sequence);
    			add_location(img, file$e, 327, 28, 13269);
    			attr_dev(div4, "class", "review_photo");
    			add_location(div4, file$e, 314, 24, 12655);
    			attr_dev(div5, "class", "review_preview");
    			add_location(div5, file$e, 303, 20, 12150);
    			attr_dev(article, "class", "user-review");
    			add_location(article, file$e, 282, 16, 11173);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, span0);
    			append_dev(div0, t2);
    			append_dev(div0, span1);
    			append_dev(span1, t3);
    			append_dev(div0, t4);
    			append_dev(div0, span2);
    			append_dev(span2, t5);
    			append_dev(article, t6);
    			append_dev(article, div5);
    			append_dev(div5, div3);
    			append_dev(div3, p1);
    			append_dev(p1, t7);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, a);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div4, img);
    			append_dev(article, t11);
    			if (if_block) if_block.m(article, null);
    			append_dev(article, t12);

    			if (!mounted) {
    				dispose = listen_dev(div4, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*reviews*/ 8 && t0_value !== (t0_value = /*review*/ ctx[0].title + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*reviews*/ 8) {
    				set_style(span0, "width", /*review*/ ctx[0].rating * 20 + "%");
    			}

    			if (dirty[0] & /*reviews*/ 8 && t3_value !== (t3_value = /*review*/ ctx[0].name + "")) set_data_dev(t3, t3_value);
    			if (dirty[0] & /*reviews*/ 8 && t5_value !== (t5_value = /*review*/ ctx[0].reviewDate + "")) set_data_dev(t5, t5_value);
    			if (dirty[0] & /*reviews*/ 8 && t7_value !== (t7_value = /*review*/ ctx[0].content + "")) set_data_dev(t7, t7_value);

    			if (dirty[0] & /*reviews*/ 8 && !src_url_equal(img.src, img_src_value = /*review*/ ctx[0].images[0]?.image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*reviews*/ 8 && img_alt_value !== (img_alt_value = /*review*/ ctx[0].images[0]?.sequence)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (/*reviewDetailsShown*/ ctx[5][/*index*/ ctx[37]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(article, t12);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$3.name,
    		type: "each",
    		source: "(282:12) {#each reviews as review, index}",
    		ctx
    	});

    	return block;
    }

    // (377:16) {#each Array(pageCount) as _, index}
    function create_each_block$4(ctx) {
    	let li;
    	let button;
    	let t0_value = /*index*/ ctx[37] + 1 + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[32](/*index*/ ctx[37]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			add_location(button, file$e, 378, 24, 15689);
    			add_location(li, file$e, 377, 20, 15659);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_4, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(377:16) {#each Array(pageCount) as _, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let if_block_anchor;
    	let if_block = /*reviews*/ ctx[3] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*reviews*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getBase64(file) {
    	return new Promise((resolve, reject) => {
    			const reader = new FileReader();
    			reader.readAsDataURL(file);
    			reader.onload = () => resolve(reader.result);
    			reader.onerror = error => reject(error);
    		});
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ReviewSection', slots, []);
    	let { productId } = $$props;
    	let { review } = $$props;
    	let { product } = $$props;
    	let reviews;
    	let page;
    	let pageCount;
    	let reviewDetailsShown;

    	onMount(async () => {
    		const res = await fetch(`${URL$1}/api/v1/product/${productId}/reviews`);
    		const jsonBody = await res.json();

    		$$invalidate(3, reviews = jsonBody.reviews.map(review => {
    			const date = new Date(review.reviewDate);
    			review.reviewDate = date.toLocaleString();
    			return review;
    		}));

    		page = jsonBody.page;
    		$$invalidate(4, pageCount = jsonBody.pageCount);
    		$$invalidate(5, reviewDetailsShown = Array(5).map(i => false));
    	});

    	const setPage = async page => {
    		const res = await fetch(`${URL$1}/api/v1/product/${productId}/reviews?page=${page}`);
    		const jsonBody = await res.json();

    		$$invalidate(3, reviews = jsonBody.reviews.map(review => {
    			const date = new Date(review.reviewDate);
    			review.reviewDate = date.toLocaleString();
    			return review;
    		}));

    		page = jsonBody.page;
    		$$invalidate(4, pageCount = jsonBody.pageCount);
    	};

    	const addPage = () => {
    		if (page < pageCount) setPage(page + 1);
    	};

    	const subPage = () => {
    		if (page > 1) setPage(page - 1);
    	};

    	let currentDetailImage = '';
    	let reviewWrite = false;
    	let reviewProductInfo;

    	const writeReviewCheck = async () => {
    		const token = localStorage.getItem('token');
    		const userId = localStorage.getItem('userId');

    		if (!token || !userId) {
    			alert('로그인 후 이용 가능합니다.');
    			return;
    		}

    		const res = await fetch(`${URL$1}/api/v1/user/${userId}/product/${productId}/info`, {
    			method: 'GET',
    			headers: {
    				'Content-Type': 'application/json',
    				Authorization: token
    			}
    		});

    		if (res.status === 404) {
    			alert('구매내역이 없습니다.');
    		} else if (res.status === 401) {
    			alert('로그인 후 이용 가능합니다.');
    			localStorage.clear();
    		} else if (res.status === 200) {
    			$$invalidate(8, reviewProductInfo = await res.json());
    			$$invalidate(7, reviewWrite = true);
    		}
    	};

    	let images = [];

    	const onFileSelected = async e => {
    		const image = e.target.files[0];
    		const imageStr = await getBase64(image);
    		$$invalidate(2, images = [...images, imageStr]);
    	};

    	let rating;
    	let title;
    	let content;

    	const writeReview = async () => {
    		if (images.length === 0) {
    			alert('이미지를 하나 이상 업로드 해야합니다!');
    			return;
    		}

    		const userId = localStorage.getItem('userId');
    		const token = localStorage.getItem('token');

    		if (userId && token) {
    			const res = await fetch(`${URL$1}/api/v1/user/${userId}/review`, {
    				method: 'POST',
    				headers: {
    					'Content-Type': 'application/json',
    					Authorization: token
    				},
    				body: JSON.stringify({
    					productId: Number(productId),
    					userId,
    					rating,
    					title,
    					content,
    					images,
    					orderProductId: reviewProductInfo.orderProductId
    				})
    			});

    			if (res.status === 201) {
    				alert('리뷰가 작성되었습니다.');
    				$$invalidate(7, reviewWrite = false);
    				$$invalidate(2, images = []);
    			} else if (res.status === 400) {
    				alert('리뷰 작성에 실패했습니다.');
    			} else if (res.status === 401) {
    				alert('로그인이 필요합니다.');
    				$$invalidate(7, reviewWrite = false);
    				$$invalidate(2, images = []);
    				localStorage.clear();
    			}
    		}
    	};

    	const writable_props = ['productId', 'review', 'product'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ReviewSection> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input0_change_handler() {
    		rating = this.__value;
    		$$invalidate(9, rating);
    	}

    	function input1_change_handler() {
    		rating = this.__value;
    		$$invalidate(9, rating);
    	}

    	function input2_change_handler() {
    		rating = this.__value;
    		$$invalidate(9, rating);
    	}

    	function input3_change_handler() {
    		rating = this.__value;
    		$$invalidate(9, rating);
    	}

    	function input4_change_handler() {
    		rating = this.__value;
    		$$invalidate(9, rating);
    	}

    	function input5_input_handler() {
    		title = this.value;
    		$$invalidate(10, title);
    	}

    	function textarea_input_handler() {
    		content = this.value;
    		$$invalidate(11, content);
    	}

    	const change_handler = e => onFileSelected(e);

    	const click_handler = () => {
    		$$invalidate(7, reviewWrite = false);
    		$$invalidate(2, images = []);
    	};

    	const click_handler_1 = (index, review) => {
    		$$invalidate(5, reviewDetailsShown[index] = !reviewDetailsShown[index], reviewDetailsShown);
    		$$invalidate(6, currentDetailImage = review.images[0]?.image);
    	};

    	const click_handler_2 = index => $$invalidate(5, reviewDetailsShown[index] = false, reviewDetailsShown);
    	const click_handler_3 = image => $$invalidate(6, currentDetailImage = image.image);
    	const click_handler_4 = index => setPage(index + 1);

    	function section_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			review = $$value;
    			$$invalidate(0, review);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('productId' in $$props) $$invalidate(18, productId = $$props.productId);
    		if ('review' in $$props) $$invalidate(0, review = $$props.review);
    		if ('product' in $$props) $$invalidate(1, product = $$props.product);
    	};

    	$$self.$capture_state = () => ({
    		productId,
    		review,
    		product,
    		onMount,
    		URL: URL$1,
    		reviews,
    		page,
    		pageCount,
    		reviewDetailsShown,
    		setPage,
    		addPage,
    		subPage,
    		currentDetailImage,
    		reviewWrite,
    		reviewProductInfo,
    		writeReviewCheck,
    		images,
    		getBase64,
    		onFileSelected,
    		rating,
    		title,
    		content,
    		writeReview
    	});

    	$$self.$inject_state = $$props => {
    		if ('productId' in $$props) $$invalidate(18, productId = $$props.productId);
    		if ('review' in $$props) $$invalidate(0, review = $$props.review);
    		if ('product' in $$props) $$invalidate(1, product = $$props.product);
    		if ('reviews' in $$props) $$invalidate(3, reviews = $$props.reviews);
    		if ('page' in $$props) page = $$props.page;
    		if ('pageCount' in $$props) $$invalidate(4, pageCount = $$props.pageCount);
    		if ('reviewDetailsShown' in $$props) $$invalidate(5, reviewDetailsShown = $$props.reviewDetailsShown);
    		if ('currentDetailImage' in $$props) $$invalidate(6, currentDetailImage = $$props.currentDetailImage);
    		if ('reviewWrite' in $$props) $$invalidate(7, reviewWrite = $$props.reviewWrite);
    		if ('reviewProductInfo' in $$props) $$invalidate(8, reviewProductInfo = $$props.reviewProductInfo);
    		if ('images' in $$props) $$invalidate(2, images = $$props.images);
    		if ('rating' in $$props) $$invalidate(9, rating = $$props.rating);
    		if ('title' in $$props) $$invalidate(10, title = $$props.title);
    		if ('content' in $$props) $$invalidate(11, content = $$props.content);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*images*/ 4) ;
    	};

    	return [
    		review,
    		product,
    		images,
    		reviews,
    		pageCount,
    		reviewDetailsShown,
    		currentDetailImage,
    		reviewWrite,
    		reviewProductInfo,
    		rating,
    		title,
    		content,
    		setPage,
    		addPage,
    		subPage,
    		writeReviewCheck,
    		onFileSelected,
    		writeReview,
    		productId,
    		input0_change_handler,
    		$$binding_groups,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_handler,
    		input4_change_handler,
    		input5_input_handler,
    		textarea_input_handler,
    		change_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		section_binding
    	];
    }

    class ReviewSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { productId: 18, review: 0, product: 1 }, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReviewSection",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*productId*/ ctx[18] === undefined && !('productId' in props)) {
    			console.warn("<ReviewSection> was created without expected prop 'productId'");
    		}

    		if (/*review*/ ctx[0] === undefined && !('review' in props)) {
    			console.warn("<ReviewSection> was created without expected prop 'review'");
    		}

    		if (/*product*/ ctx[1] === undefined && !('product' in props)) {
    			console.warn("<ReviewSection> was created without expected prop 'product'");
    		}
    	}

    	get productId() {
    		throw new Error("<ReviewSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set productId(value) {
    		throw new Error("<ReviewSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get review() {
    		throw new Error("<ReviewSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set review(value) {
    		throw new Error("<ReviewSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get product() {
    		throw new Error("<ReviewSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set product(value) {
    		throw new Error("<ReviewSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\product\detail\QnaSection.svelte generated by Svelte v3.48.0 */
    const file$d = "src\\components\\product\\detail\\QnaSection.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (86:0) {#if qnas}
    function create_if_block$5(ctx) {
    	let section;
    	let div0;
    	let h2;
    	let t1;
    	let p;
    	let t3;
    	let button0;
    	let t5;
    	let t6;
    	let t7;
    	let div3;
    	let div1;
    	let button1;
    	let t9;
    	let ul;
    	let t10;
    	let div2;
    	let button2;
    	let mounted;
    	let dispose;
    	let if_block = /*qnaWrite*/ ctx[1] && create_if_block_2$1(ctx);
    	let each_value_1 = /*qnas*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let each_value = Array(/*pageCount*/ ctx[3]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "상품문의";
    			t1 = space();
    			p = element("p");
    			p.textContent = "- 문의 혹은 주문이 많을 경우 답에 다소 시간이 지연될 수 있습니다";
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "문의하기";
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t7 = space();
    			div3 = element("div");
    			div1 = element("div");
    			button1 = element("button");
    			button1.textContent = "<";
    			t9 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			div2 = element("div");
    			button2 = element("button");
    			button2.textContent = ">";
    			attr_dev(h2, "class", "section-tit");
    			add_location(h2, file$d, 88, 12, 2731);
    			attr_dev(p, "class", "section-tit-des");
    			add_location(p, file$d, 89, 12, 2778);
    			attr_dev(button0, "class", "write-qna-btn");
    			add_location(button0, file$d, 92, 12, 2893);
    			attr_dev(div0, "class", "tit-box");
    			add_location(div0, file$d, 87, 8, 2676);
    			add_location(button1, file$d, 156, 16, 5422);
    			attr_dev(div1, "class", "btn-grp prev-btn");
    			add_location(div1, file$d, 155, 12, 5374);
    			add_location(ul, file$d, 158, 12, 5496);
    			add_location(button2, file$d, 168, 16, 5859);
    			attr_dev(div2, "class", "btn-grp next-btn");
    			add_location(div2, file$d, 167, 12, 5811);
    			attr_dev(div3, "class", "pager");
    			add_location(div3, file$d, 154, 8, 5341);
    			attr_dev(section, "class", "product-qna");
    			attr_dev(section, "id", "qna");
    			add_location(section, file$d, 86, 4, 2612);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(div0, t3);
    			append_dev(div0, button0);
    			append_dev(section, t5);
    			if (if_block) if_block.m(section, null);
    			append_dev(section, t6);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(section, null);
    			}

    			append_dev(section, t7);
    			append_dev(section, div3);
    			append_dev(div3, div1);
    			append_dev(div1, button1);
    			append_dev(div3, t9);
    			append_dev(div3, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(div2, button2);
    			/*section_binding*/ ctx[14](section);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*qnaPopup*/ ctx[8], false, false, false),
    					listen_dev(div0, "click", /*qnaPopup*/ ctx[8], false, false, false),
    					listen_dev(button1, "click", /*subPage*/ ctx[7], false, false, false),
    					listen_dev(button2, "click", /*addPage*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*qnaWrite*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					if_block.m(section, t6);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*qnas*/ 4) {
    				each_value_1 = /*qnas*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(section, t7);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*setPage, pageCount*/ 40) {
    				each_value = Array(/*pageCount*/ ctx[3]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			/*section_binding*/ ctx[14](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(86:0) {#if qnas}",
    		ctx
    	});

    	return block;
    }

    // (96:8) {#if qnaWrite}
    function create_if_block_2$1(ctx) {
    	let div3;
    	let div2;
    	let button0;
    	let t1;
    	let h2;
    	let t3;
    	let div1;
    	let fieldset;
    	let legend;
    	let t5;
    	let div0;
    	let h3;
    	let t7;
    	let textarea;
    	let t8;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "닫기";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "문의하기";
    			t3 = space();
    			div1 = element("div");
    			fieldset = element("fieldset");
    			legend = element("legend");
    			legend.textContent = "문의하기";
    			t5 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "문의 내용";
    			t7 = space();
    			textarea = element("textarea");
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "문의남기기";
    			attr_dev(button0, "class", "close-btn");
    			add_location(button0, file$d, 98, 20, 3114);
    			attr_dev(h2, "class", "section-tit");
    			add_location(h2, file$d, 102, 20, 3281);
    			add_location(legend, file$d, 106, 28, 3427);
    			attr_dev(h3, "class", "qna-tit");
    			add_location(h3, file$d, 109, 32, 3539);
    			attr_dev(textarea, "name", "문의내용");
    			textarea.required = true;
    			attr_dev(textarea, "placeholder", "문의내용을 남겨주세요");
    			add_location(textarea, file$d, 110, 32, 3603);
    			attr_dev(div0, "class", "qna-content");
    			add_location(div0, file$d, 108, 28, 3480);
    			add_location(fieldset, file$d, 105, 24, 3387);
    			attr_dev(button1, "class", "qna-submit");
    			add_location(button1, file$d, 119, 24, 3966);
    			attr_dev(div1, "class", "form-wrap");
    			add_location(div1, file$d, 104, 20, 3338);
    			attr_dev(div2, "class", "content-box");
    			add_location(div2, file$d, 97, 16, 3067);
    			attr_dev(div3, "class", "write-qna");
    			attr_dev(div3, "id", "writeQna");
    			add_location(div3, file$d, 96, 12, 3012);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(div2, t1);
    			append_dev(div2, h2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, fieldset);
    			append_dev(fieldset, legend);
    			append_dev(fieldset, t5);
    			append_dev(fieldset, div0);
    			append_dev(div0, h3);
    			append_dev(div0, t7);
    			append_dev(div0, textarea);
    			set_input_value(textarea, /*question*/ ctx[4]);
    			append_dev(div1, t8);
    			append_dev(div1, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[11], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[12]),
    					listen_dev(button1, "click", /*writeQna*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*question*/ 16) {
    				set_input_value(textarea, /*question*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(96:8) {#if qnaWrite}",
    		ctx
    	});

    	return block;
    }

    // (140:16) {#if qna.answer}
    function create_if_block_1$1(ctx) {
    	let div1;
    	let strong;
    	let t1;
    	let div0;
    	let h3;
    	let span;
    	let t2_value = /*qna*/ ctx[0].answerDate + "";
    	let t2;
    	let t3;
    	let p;
    	let t4_value = /*qna*/ ctx[0].answer + "";
    	let t4;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			strong = element("strong");
    			strong.textContent = "답변";
    			t1 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			p = element("p");
    			t4 = text(t4_value);
    			attr_dev(strong, "class", "qna-badge");
    			add_location(strong, file$d, 141, 24, 4824);
    			attr_dev(span, "class", "qna-date");
    			add_location(span, file$d, 144, 32, 4997);
    			attr_dev(h3, "class", "qna-info");
    			add_location(h3, file$d, 143, 28, 4942);
    			attr_dev(p, "class", "qna-txt");
    			add_location(p, file$d, 146, 28, 5108);
    			attr_dev(div0, "class", "qna-details");
    			add_location(div0, file$d, 142, 24, 4887);
    			attr_dev(div1, "class", "saller-a");
    			add_location(div1, file$d, 140, 20, 4776);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, strong);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(h3, span);
    			append_dev(span, t2);
    			append_dev(div0, t3);
    			append_dev(div0, p);
    			append_dev(p, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*qnas*/ 4 && t2_value !== (t2_value = /*qna*/ ctx[0].answerDate + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*qnas*/ 4 && t4_value !== (t4_value = /*qna*/ ctx[0].answer + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(140:16) {#if qna.answer}",
    		ctx
    	});

    	return block;
    }

    // (128:8) {#each qnas as qna}
    function create_each_block_1$2(ctx) {
    	let article;
    	let div1;
    	let strong;
    	let t1;
    	let div0;
    	let h3;
    	let b;
    	let t2_value = /*qna*/ ctx[0].userId + "";
    	let t2;
    	let t3;
    	let span;
    	let t4_value = /*qna*/ ctx[0].questionDate + "";
    	let t4;
    	let t5;
    	let p;
    	let t6_value = /*qna*/ ctx[0].question + "";
    	let t6;
    	let t7;
    	let if_block = /*qna*/ ctx[0].answer && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			article = element("article");
    			div1 = element("div");
    			strong = element("strong");
    			strong.textContent = "질문";
    			t1 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			b = element("b");
    			t2 = text(t2_value);
    			t3 = space();
    			span = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			p = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			if (if_block) if_block.c();
    			attr_dev(strong, "class", "qna-badge");
    			add_location(strong, file$d, 130, 20, 4300);
    			attr_dev(b, "class", "user-id");
    			add_location(b, file$d, 133, 28, 4461);
    			attr_dev(span, "class", "qna-date");
    			add_location(span, file$d, 134, 28, 4526);
    			attr_dev(h3, "class", "qna-info");
    			add_location(h3, file$d, 132, 24, 4410);
    			attr_dev(p, "class", "qna-txt");
    			add_location(p, file$d, 136, 24, 4631);
    			attr_dev(div0, "class", "qna-details");
    			add_location(div0, file$d, 131, 20, 4359);
    			attr_dev(div1, "class", "user-q");
    			add_location(div1, file$d, 129, 16, 4258);
    			attr_dev(article, "class", "qna-box");
    			add_location(article, file$d, 128, 12, 4215);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, div1);
    			append_dev(div1, strong);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(h3, b);
    			append_dev(b, t2);
    			append_dev(h3, t3);
    			append_dev(h3, span);
    			append_dev(span, t4);
    			append_dev(div0, t5);
    			append_dev(div0, p);
    			append_dev(p, t6);
    			append_dev(article, t7);
    			if (if_block) if_block.m(article, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*qnas*/ 4 && t2_value !== (t2_value = /*qna*/ ctx[0].userId + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*qnas*/ 4 && t4_value !== (t4_value = /*qna*/ ctx[0].questionDate + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*qnas*/ 4 && t6_value !== (t6_value = /*qna*/ ctx[0].question + "")) set_data_dev(t6, t6_value);

    			if (/*qna*/ ctx[0].answer) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(article, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(128:8) {#each qnas as qna}",
    		ctx
    	});

    	return block;
    }

    // (160:16) {#each Array(pageCount) as _, index}
    function create_each_block$3(ctx) {
    	let li;
    	let button;
    	let t0_value = /*index*/ ctx[18] + 1 + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[13](/*index*/ ctx[18]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			add_location(button, file$d, 161, 24, 5606);
    			add_location(li, file$d, 160, 20, 5576);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(160:16) {#each Array(pageCount) as _, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let if_block_anchor;
    	let if_block = /*qnas*/ ctx[2] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*qnas*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('QnaSection', slots, []);
    	let { productId } = $$props;
    	let { qna } = $$props;
    	let qnaWrite = false;
    	let qnas;
    	let page;
    	let pageCount;

    	onMount(async () => {
    		const res = await fetch(`${URL$1}/api/v1/product/${productId}/qnas`);
    		const jsonBody = await res.json();

    		$$invalidate(2, qnas = jsonBody.qnas.map(qna => {
    			const questionDate = new Date(qna.questionDate);
    			const answerDate = new Date(qna.answerDate);
    			qna.questionDate = questionDate.toLocaleString();

    			qna.answerDate = answerDate === null || answerDate === void 0
    			? void 0
    			: answerDate.toLocaleString();

    			return qna;
    		}));

    		page = jsonBody.page;
    		$$invalidate(3, pageCount = jsonBody.pageCount);
    	});

    	const setPage = async page => {
    		const res = await fetch(`${URL$1}/api/v1/product/${productId}/qnas?page=${page}`);
    		const jsonBody = await res.json();

    		$$invalidate(2, qnas = jsonBody.qnas.map(qna => {
    			const questionDate = new Date(qna.questionDate);
    			const answerDate = new Date(qna.answerDate);
    			qna.questionDate = questionDate.toLocaleString();

    			qna.answerDate = answerDate === null || answerDate === void 0
    			? void 0
    			: answerDate.toLocaleString();

    			return qna;
    		}));

    		page = jsonBody.page;
    		$$invalidate(3, pageCount = jsonBody.pageCount);
    	};

    	const addPage = () => {
    		if (page < pageCount) setPage(page + 1);
    	};

    	const subPage = () => {
    		if (page > 1) setPage(page - 1);
    	};

    	const qnaPopup = () => {
    		const token = localStorage.getItem('token');

    		if (token) {
    			$$invalidate(1, qnaWrite = true);
    		} else {
    			alert('로그인 후 이용 가능합니다.');
    		}
    	};

    	let question;

    	const writeQna = async () => {
    		const token = localStorage.getItem('token');
    		const userId = localStorage.getItem('userId');

    		if (userId) {
    			const res = await fetch(`${URL$1}/api/v1/user/${userId}/qna`, {
    				method: 'POST',
    				headers: {
    					'Content-Type': 'application/json',
    					Authorization: token
    				},
    				body: JSON.stringify({
    					productId: Number(productId),
    					userId,
    					question
    				})
    			});

    			if (res.status === 201) {
    				alert('문의 작성에 성공했습니다.');
    				location.reload();
    			} else if (res.status === 401) {
    				alert('로그인 후 이용 가능합니다.');
    			} else {
    				alert('문의 작성에 실패했습니다.');
    			}
    		} else {
    			alert('로그인 후 이용 가능합니다.');
    		}
    	};

    	const writable_props = ['productId', 'qna'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<QnaSection> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, qnaWrite = false);

    	function textarea_input_handler() {
    		question = this.value;
    		$$invalidate(4, question);
    	}

    	const click_handler_1 = index => setPage(index + 1);

    	function section_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			qna = $$value;
    			$$invalidate(0, qna);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('productId' in $$props) $$invalidate(10, productId = $$props.productId);
    		if ('qna' in $$props) $$invalidate(0, qna = $$props.qna);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		URL: URL$1,
    		productId,
    		qna,
    		qnaWrite,
    		qnas,
    		page,
    		pageCount,
    		setPage,
    		addPage,
    		subPage,
    		qnaPopup,
    		question,
    		writeQna
    	});

    	$$self.$inject_state = $$props => {
    		if ('productId' in $$props) $$invalidate(10, productId = $$props.productId);
    		if ('qna' in $$props) $$invalidate(0, qna = $$props.qna);
    		if ('qnaWrite' in $$props) $$invalidate(1, qnaWrite = $$props.qnaWrite);
    		if ('qnas' in $$props) $$invalidate(2, qnas = $$props.qnas);
    		if ('page' in $$props) page = $$props.page;
    		if ('pageCount' in $$props) $$invalidate(3, pageCount = $$props.pageCount);
    		if ('question' in $$props) $$invalidate(4, question = $$props.question);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		qna,
    		qnaWrite,
    		qnas,
    		pageCount,
    		question,
    		setPage,
    		addPage,
    		subPage,
    		qnaPopup,
    		writeQna,
    		productId,
    		click_handler,
    		textarea_input_handler,
    		click_handler_1,
    		section_binding
    	];
    }

    class QnaSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { productId: 10, qna: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QnaSection",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*productId*/ ctx[10] === undefined && !('productId' in props)) {
    			console.warn("<QnaSection> was created without expected prop 'productId'");
    		}

    		if (/*qna*/ ctx[0] === undefined && !('qna' in props)) {
    			console.warn("<QnaSection> was created without expected prop 'qna'");
    		}
    	}

    	get productId() {
    		throw new Error("<QnaSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set productId(value) {
    		throw new Error("<QnaSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get qna() {
    		throw new Error("<QnaSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set qna(value) {
    		throw new Error("<QnaSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\routes\product\ProductDetail.svelte generated by Svelte v3.48.0 */
    const file$c = "src\\routes\\product\\ProductDetail.svelte";

    function create_fragment$e(ctx) {
    	let scrolling = false;

    	let clear_scrolling = () => {
    		scrolling = false;
    	};

    	let scrolling_timeout;
    	let header;
    	let t0;
    	let div3;
    	let productsection;
    	let updating_product;
    	let t1;
    	let div2;
    	let div1;
    	let div0;
    	let ul;
    	let li0;
    	let span0;
    	let li0_class_value;
    	let t3;
    	let li1;
    	let span1;
    	let li1_class_value;
    	let t5;
    	let li2;
    	let span2;
    	let li2_class_value;
    	let t7;
    	let section;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t8;
    	let reviewsection;
    	let updating_review;
    	let updating_product_1;
    	let t9;
    	let qnasection;
    	let updating_qna;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowscroll*/ ctx[9]);
    	header = new Header({ $$inline: true });

    	function productsection_product_binding(value) {
    		/*productsection_product_binding*/ ctx[10](value);
    	}

    	let productsection_props = { productId: /*params*/ ctx[0].productId };

    	if (/*product*/ ctx[5] !== void 0) {
    		productsection_props.product = /*product*/ ctx[5];
    	}

    	productsection = new ProductSection({
    			props: productsection_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(productsection, 'product', productsection_product_binding));

    	function reviewsection_review_binding(value) {
    		/*reviewsection_review_binding*/ ctx[15](value);
    	}

    	function reviewsection_product_binding(value) {
    		/*reviewsection_product_binding*/ ctx[16](value);
    	}

    	let reviewsection_props = { productId: /*params*/ ctx[0].productId };

    	if (/*review*/ ctx[1] !== void 0) {
    		reviewsection_props.review = /*review*/ ctx[1];
    	}

    	if (/*product*/ ctx[5] !== void 0) {
    		reviewsection_props.product = /*product*/ ctx[5];
    	}

    	reviewsection = new ReviewSection({
    			props: reviewsection_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(reviewsection, 'review', reviewsection_review_binding));
    	binding_callbacks.push(() => bind(reviewsection, 'product', reviewsection_product_binding));

    	function qnasection_qna_binding(value) {
    		/*qnasection_qna_binding*/ ctx[17](value);
    	}

    	let qnasection_props = { productId: /*params*/ ctx[0].productId };

    	if (/*qna*/ ctx[2] !== void 0) {
    		qnasection_props.qna = /*qna*/ ctx[2];
    	}

    	qnasection = new QnaSection({ props: qnasection_props, $$inline: true });
    	binding_callbacks.push(() => bind(qnasection, 'qna', qnasection_qna_binding));

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div3 = element("div");
    			create_component(productsection.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			span0 = element("span");
    			span0.textContent = "상세정보";
    			t3 = space();
    			li1 = element("li");
    			span1 = element("span");
    			span1.textContent = "상품평";
    			t5 = space();
    			li2 = element("li");
    			span2 = element("span");
    			span2.textContent = "상품문의";
    			t7 = space();
    			section = element("section");
    			img = element("img");
    			t8 = space();
    			create_component(reviewsection.$$.fragment);
    			t9 = space();
    			create_component(qnasection.$$.fragment);
    			attr_dev(span0, "class", "svelte-19qcv9k");
    			add_location(span0, file$c, 37, 24, 1473);
    			attr_dev(li0, "class", li0_class_value = "" + (null_to_empty(/*detailsStatus*/ ctx[8]) + " svelte-19qcv9k"));
    			add_location(li0, file$c, 33, 20, 1302);
    			attr_dev(span1, "class", "svelte-19qcv9k");
    			add_location(span1, file$c, 43, 24, 1708);
    			attr_dev(li1, "class", li1_class_value = "" + (null_to_empty(/*reviewStatus*/ ctx[7]) + " svelte-19qcv9k"));
    			add_location(li1, file$c, 39, 20, 1539);
    			attr_dev(span2, "class", "svelte-19qcv9k");
    			add_location(span2, file$c, 49, 24, 1936);
    			attr_dev(li2, "class", li2_class_value = "" + (null_to_empty(/*qnaStatus*/ ctx[6]) + " svelte-19qcv9k"));
    			add_location(li2, file$c, 45, 20, 1773);
    			attr_dev(ul, "class", "svelte-19qcv9k");
    			add_location(ul, file$c, 32, 16, 1276);
    			attr_dev(div0, "class", "product_tab-titles svelte-19qcv9k");
    			add_location(div0, file$c, 31, 12, 1226);
    			if (!src_url_equal(img.src, img_src_value = /*product*/ ctx[5]?.detailInfo)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*product*/ ctx[5]?.name);
    			attr_dev(img, "class", "svelte-19qcv9k");
    			add_location(img, file$c, 55, 16, 2155);
    			attr_dev(section, "class", "product-detail svelte-19qcv9k");
    			attr_dev(section, "id", "details");
    			add_location(section, file$c, 53, 12, 2037);
    			attr_dev(div1, "class", "inner svelte-19qcv9k");
    			add_location(div1, file$c, 30, 8, 1193);
    			attr_dev(div2, "class", "tab-contents svelte-19qcv9k");
    			add_location(div2, file$c, 29, 4, 1157);
    			attr_dev(div3, "class", "container svelte-19qcv9k");
    			add_location(div3, file$c, 25, 0, 1031);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div3, anchor);
    			mount_component(productsection, div3, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, ul);
    			append_dev(ul, li0);
    			append_dev(li0, span0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, span1);
    			append_dev(ul, t5);
    			append_dev(ul, li2);
    			append_dev(li2, span2);
    			append_dev(div1, t7);
    			append_dev(div1, section);
    			append_dev(section, img);
    			/*section_binding*/ ctx[14](section);
    			append_dev(div1, t8);
    			mount_component(reviewsection, div1, null);
    			append_dev(div1, t9);
    			mount_component(qnasection, div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "scroll", () => {
    						scrolling = true;
    						clearTimeout(scrolling_timeout);
    						scrolling_timeout = setTimeout(clear_scrolling, 100);
    						/*onwindowscroll*/ ctx[9]();
    					}),
    					listen_dev(li0, "click", /*click_handler*/ ctx[11], false, false, false),
    					listen_dev(li1, "click", /*click_handler_1*/ ctx[12], false, false, false),
    					listen_dev(li2, "click", /*click_handler_2*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*scrollY*/ 8 && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrollTo(window.pageXOffset, /*scrollY*/ ctx[3]);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    			}

    			const productsection_changes = {};
    			if (dirty & /*params*/ 1) productsection_changes.productId = /*params*/ ctx[0].productId;

    			if (!updating_product && dirty & /*product*/ 32) {
    				updating_product = true;
    				productsection_changes.product = /*product*/ ctx[5];
    				add_flush_callback(() => updating_product = false);
    			}

    			productsection.$set(productsection_changes);

    			if (!current || dirty & /*detailsStatus*/ 256 && li0_class_value !== (li0_class_value = "" + (null_to_empty(/*detailsStatus*/ ctx[8]) + " svelte-19qcv9k"))) {
    				attr_dev(li0, "class", li0_class_value);
    			}

    			if (!current || dirty & /*reviewStatus*/ 128 && li1_class_value !== (li1_class_value = "" + (null_to_empty(/*reviewStatus*/ ctx[7]) + " svelte-19qcv9k"))) {
    				attr_dev(li1, "class", li1_class_value);
    			}

    			if (!current || dirty & /*qnaStatus*/ 64 && li2_class_value !== (li2_class_value = "" + (null_to_empty(/*qnaStatus*/ ctx[6]) + " svelte-19qcv9k"))) {
    				attr_dev(li2, "class", li2_class_value);
    			}

    			if (!current || dirty & /*product*/ 32 && !src_url_equal(img.src, img_src_value = /*product*/ ctx[5]?.detailInfo)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*product*/ 32 && img_alt_value !== (img_alt_value = /*product*/ ctx[5]?.name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			const reviewsection_changes = {};
    			if (dirty & /*params*/ 1) reviewsection_changes.productId = /*params*/ ctx[0].productId;

    			if (!updating_review && dirty & /*review*/ 2) {
    				updating_review = true;
    				reviewsection_changes.review = /*review*/ ctx[1];
    				add_flush_callback(() => updating_review = false);
    			}

    			if (!updating_product_1 && dirty & /*product*/ 32) {
    				updating_product_1 = true;
    				reviewsection_changes.product = /*product*/ ctx[5];
    				add_flush_callback(() => updating_product_1 = false);
    			}

    			reviewsection.$set(reviewsection_changes);
    			const qnasection_changes = {};
    			if (dirty & /*params*/ 1) qnasection_changes.productId = /*params*/ ctx[0].productId;

    			if (!updating_qna && dirty & /*qna*/ 4) {
    				updating_qna = true;
    				qnasection_changes.qna = /*qna*/ ctx[2];
    				add_flush_callback(() => updating_qna = false);
    			}

    			qnasection.$set(qnasection_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(productsection.$$.fragment, local);
    			transition_in(reviewsection.$$.fragment, local);
    			transition_in(qnasection.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(productsection.$$.fragment, local);
    			transition_out(reviewsection.$$.fragment, local);
    			transition_out(qnasection.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div3);
    			destroy_component(productsection);
    			/*section_binding*/ ctx[14](null);
    			destroy_component(reviewsection);
    			destroy_component(qnasection);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let detailsStatus;
    	let reviewStatus;
    	let qnaStatus;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProductDetail', slots, []);
    	let { params = {} } = $$props;
    	let details;
    	let review;
    	let qna;
    	let scrollY;
    	let product;
    	const writable_props = ['params'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ProductDetail> was created with unknown prop '${key}'`);
    	});

    	function onwindowscroll() {
    		$$invalidate(3, scrollY = window.pageYOffset);
    	}

    	function productsection_product_binding(value) {
    		product = value;
    		$$invalidate(5, product);
    	}

    	const click_handler = () => $$invalidate(3, scrollY = details.offsetTop);
    	const click_handler_1 = () => $$invalidate(3, scrollY = review.offsetTop);
    	const click_handler_2 = () => $$invalidate(3, scrollY = qna.offsetTop);

    	function section_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			details = $$value;
    			$$invalidate(4, details);
    		});
    	}

    	function reviewsection_review_binding(value) {
    		review = value;
    		$$invalidate(1, review);
    	}

    	function reviewsection_product_binding(value) {
    		product = value;
    		$$invalidate(5, product);
    	}

    	function qnasection_qna_binding(value) {
    		qna = value;
    		$$invalidate(2, qna);
    	}

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		ProductSection,
    		ReviewSection,
    		QnaSection,
    		Header,
    		params,
    		details,
    		review,
    		qna,
    		scrollY,
    		product,
    		qnaStatus,
    		reviewStatus,
    		detailsStatus
    	});

    	$$self.$inject_state = $$props => {
    		if ('params' in $$props) $$invalidate(0, params = $$props.params);
    		if ('details' in $$props) $$invalidate(4, details = $$props.details);
    		if ('review' in $$props) $$invalidate(1, review = $$props.review);
    		if ('qna' in $$props) $$invalidate(2, qna = $$props.qna);
    		if ('scrollY' in $$props) $$invalidate(3, scrollY = $$props.scrollY);
    		if ('product' in $$props) $$invalidate(5, product = $$props.product);
    		if ('qnaStatus' in $$props) $$invalidate(6, qnaStatus = $$props.qnaStatus);
    		if ('reviewStatus' in $$props) $$invalidate(7, reviewStatus = $$props.reviewStatus);
    		if ('detailsStatus' in $$props) $$invalidate(8, detailsStatus = $$props.detailsStatus);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*scrollY, review*/ 10) {
    			$$invalidate(8, detailsStatus = scrollY < (review === null || review === void 0
    			? void 0
    			: review.offsetTop)
    			? 'active'
    			: '');
    		}

    		if ($$self.$$.dirty & /*scrollY, review, qna*/ 14) {
    			$$invalidate(7, reviewStatus = scrollY >= (review === null || review === void 0
    			? void 0
    			: review.offsetTop) && scrollY < (qna === null || qna === void 0 ? void 0 : qna.offsetTop)
    			? 'active'
    			: '');
    		}

    		if ($$self.$$.dirty & /*scrollY, qna*/ 12) {
    			$$invalidate(6, qnaStatus = scrollY >= (qna === null || qna === void 0 ? void 0 : qna.offsetTop)
    			? 'active'
    			: '');
    		}
    	};

    	return [
    		params,
    		review,
    		qna,
    		scrollY,
    		details,
    		product,
    		qnaStatus,
    		reviewStatus,
    		detailsStatus,
    		onwindowscroll,
    		productsection_product_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		section_binding,
    		reviewsection_review_binding,
    		reviewsection_product_binding,
    		qnasection_qna_binding
    	];
    }

    class ProductDetail extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductDetail",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get params() {
    		throw new Error("<ProductDetail>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<ProductDetail>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const URL = 'http://49.50.174.103:9000';
    //export const URL = 'http://localhost:9000';

    /* src\routes\user\Login.svelte generated by Svelte v3.48.0 */
    const file$b = "src\\routes\\user\\Login.svelte";

    function create_fragment$d(ctx) {
    	let div12;
    	let div10;
    	let header;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let section;
    	let div2;
    	let div1;
    	let i0;
    	let t1;
    	let input0;
    	let t2;
    	let div4;
    	let div3;
    	let i1;
    	let t3;
    	let input1;
    	let t4;
    	let div5;
    	let button0;
    	let t6;
    	let p;
    	let t7;
    	let div6;
    	let button1;
    	let t9;
    	let div7;
    	let button2;
    	let img1;
    	let img1_src_value;
    	let t10;
    	let t11;
    	let div9;
    	let div8;
    	let i2;
    	let t12;
    	let span0;
    	let t14;
    	let footer;
    	let div11;
    	let span1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div12 = element("div");
    			div10 = element("div");
    			header = element("header");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			section = element("section");
    			div2 = element("div");
    			div1 = element("div");
    			i0 = element("i");
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div4 = element("div");
    			div3 = element("div");
    			i1 = element("i");
    			t3 = space();
    			input1 = element("input");
    			t4 = space();
    			div5 = element("div");
    			button0 = element("button");
    			button0.textContent = "로그인";
    			t6 = space();
    			p = element("p");
    			t7 = space();
    			div6 = element("div");
    			button1 = element("button");
    			button1.textContent = "회원가입";
    			t9 = space();
    			div7 = element("div");
    			button2 = element("button");
    			img1 = element("img");
    			t10 = text(" 카카오 로그인/ 회원가입");
    			t11 = space();
    			div9 = element("div");
    			div8 = element("div");
    			i2 = element("i");
    			t12 = space();
    			span0 = element("span");
    			span0.textContent = "로그인 상태유지";
    			t14 = space();
    			footer = element("footer");
    			div11 = element("div");
    			span1 = element("span");
    			span1.textContent = "Copyright © My shop Corp. All Rights Reserved.";
    			if (!src_url_equal(img0.src, img0_src_value = "images/logo/logosmall2.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "300");
    			attr_dev(img0, "height", "120");
    			add_location(img0, file$b, 65, 16, 2302);
    			attr_dev(div0, "class", "member-logo svelte-z3pfg3");
    			add_location(div0, file$b, 64, 12, 2259);
    			attr_dev(header, "class", "member-header");
    			add_location(header, file$b, 63, 8, 2215);
    			attr_dev(i0, "class", "fa fa-user");
    			add_location(i0, file$b, 75, 20, 2643);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "ID");
    			attr_dev(input0, "id", "id");
    			attr_dev(input0, "class", "account svelte-z3pfg3");
    			add_location(input0, file$b, 76, 20, 2689);
    			attr_dev(div1, "class", "id_icon svelte-z3pfg3");
    			add_location(div1, file$b, 74, 16, 2600);
    			attr_dev(div2, "class", "login-input-wrap svelte-z3pfg3");
    			add_location(div2, file$b, 73, 12, 2552);
    			attr_dev(i1, "class", "fa fa-lock");
    			add_location(i1, file$b, 87, 20, 3080);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "placeholder", "Password");
    			attr_dev(input1, "id", "password");
    			attr_dev(input1, "class", "account svelte-z3pfg3");
    			add_location(input1, file$b, 88, 20, 3126);
    			attr_dev(div3, "class", "pw_icon svelte-z3pfg3");
    			add_location(div3, file$b, 86, 16, 3037);
    			attr_dev(div4, "class", "login-input-wrap password-wrap svelte-z3pfg3");
    			add_location(div4, file$b, 85, 12, 2975);
    			attr_dev(button0, "id", "login");
    			attr_dev(button0, "class", "account svelte-z3pfg3");
    			add_location(button0, file$b, 98, 16, 3477);
    			attr_dev(p, "id", "alert");
    			attr_dev(p, "class", "account");
    			add_location(p, file$b, 101, 16, 3599);
    			attr_dev(div5, "class", "login-button-wrap svelte-z3pfg3");
    			add_location(div5, file$b, 97, 12, 3428);
    			attr_dev(button1, "class", "svelte-z3pfg3");
    			add_location(button1, file$b, 104, 16, 3709);
    			attr_dev(div6, "class", "sign-in-wrap svelte-z3pfg3");
    			add_location(div6, file$b, 103, 12, 3665);
    			if (!src_url_equal(img1.src, img1_src_value = "https://www.nicepng.com/png/full/388-3888984_open-png.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "width", "20");
    			attr_dev(img1, "height", "20");
    			add_location(img1, file$b, 108, 21, 3894);
    			attr_dev(button2, "class", "svelte-z3pfg3");
    			add_location(button2, file$b, 107, 16, 3842);
    			attr_dev(div7, "class", "sign-in-kakao svelte-z3pfg3");
    			add_location(div7, file$b, 106, 12, 3797);
    			attr_dev(i2, "class", "far fa-check-square");
    			add_location(i2, file$b, 117, 20, 4258);
    			add_location(span0, file$b, 118, 20, 4313);
    			attr_dev(div8, "class", "stay_signlogo");
    			add_location(div8, file$b, 116, 16, 4209);
    			attr_dev(div9, "class", "login-stay-sign-in svelte-z3pfg3");
    			add_location(div9, file$b, 115, 12, 4159);
    			attr_dev(section, "class", "login-input-section-wrap svelte-z3pfg3");
    			add_location(section, file$b, 72, 8, 2496);
    			attr_dev(div10, "class", "wrapper svelte-z3pfg3");
    			add_location(div10, file$b, 62, 4, 2184);
    			add_location(span1, file$b, 125, 12, 4476);
    			attr_dev(div11, "class", "copyright-wrap svelte-z3pfg3");
    			add_location(div11, file$b, 124, 8, 4434);
    			attr_dev(footer, "class", "svelte-z3pfg3");
    			add_location(footer, file$b, 123, 4, 4416);
    			attr_dev(div12, "class", "member_container svelte-z3pfg3");
    			add_location(div12, file$b, 61, 0, 2148);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div10);
    			append_dev(div10, header);
    			append_dev(header, div0);
    			append_dev(div0, img0);
    			append_dev(div10, t0);
    			append_dev(div10, section);
    			append_dev(section, div2);
    			append_dev(div2, div1);
    			append_dev(div1, i0);
    			append_dev(div1, t1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*userId*/ ctx[0]);
    			append_dev(section, t2);
    			append_dev(section, div4);
    			append_dev(div4, div3);
    			append_dev(div3, i1);
    			append_dev(div3, t3);
    			append_dev(div3, input1);
    			set_input_value(input1, /*userPw*/ ctx[1]);
    			append_dev(section, t4);
    			append_dev(section, div5);
    			append_dev(div5, button0);
    			append_dev(div5, t6);
    			append_dev(div5, p);
    			append_dev(section, t7);
    			append_dev(section, div6);
    			append_dev(div6, button1);
    			append_dev(section, t9);
    			append_dev(section, div7);
    			append_dev(div7, button2);
    			append_dev(button2, img1);
    			append_dev(button2, t10);
    			append_dev(section, t11);
    			append_dev(section, div9);
    			append_dev(div9, div8);
    			append_dev(div8, i2);
    			append_dev(div8, t12);
    			append_dev(div8, span0);
    			append_dev(div12, t14);
    			append_dev(div12, footer);
    			append_dev(footer, div11);
    			append_dev(div11, span1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(button0, "click", /*login*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*click_handler*/ ctx[6], false, false, false),
    					listen_dev(button2, "click", /*kakaoLogin*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*userId*/ 1 && input0.value !== /*userId*/ ctx[0]) {
    				set_input_value(input0, /*userId*/ ctx[0]);
    			}

    			if (dirty & /*userPw*/ 2 && input1.value !== /*userPw*/ ctx[1]) {
    				set_input_value(input1, /*userPw*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div12);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	let userId;
    	let userPw;

    	const login = async () => {
    		const res = await fetch(`${URL}/api/v1/user/login`, {
    			method: 'POST',
    			headers: { 'Content-Type': 'application/json' },
    			body: JSON.stringify({ userId, userPw })
    		});

    		K(res).with({ status: 200 }, () => {
    			const token = res.headers.get('Authorization');
    			localStorage.setItem('token', token);
    			localStorage.setItem('userId', userId);
    			push('/');
    		}).with({ status: 400 }, () => alert('올바르지 않은 요청입니다.')).with({ status: 401 }, () => alert('비밀번호가 일치하지 않습니다.')).with({ status: 404 }, () => alert('존재하지 않는 계정입니다.')).exhaustive();
    	};

    	const kakaoLogin = async () => {
    		Kakao.Auth.login({
    			success: authObj => {
    				fetch(`${URL}/api/v1/user/login/kakao`, {
    					method: 'POST',
    					headers: {
    						'Content-Type': 'application/json',
    						'Data-Type': 'json'
    					},
    					body: JSON.stringify({ access_token: authObj.access_token })
    				}).then(async response => {
    					const json = await response.json();

    					if (response.status === 200) {
    						const token = response.headers.get('Authorization');
    						localStorage.setItem('token', token);
    						localStorage.setItem('userId', json.userId);
    						push('/');
    					} else if (response.status === 401) {
    						alert('추가 정보를 입력하여 회원가입을 완료하세요.');
    						registerVar.userId = json.id;
    						registerVar.userPw = '';
    						registerVar.email = json.email;
    					}
    				});
    			},
    			fail: err => alert(JSON.stringify(err))
    		});
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		userId = this.value;
    		$$invalidate(0, userId);
    	}

    	function input1_input_handler() {
    		userPw = this.value;
    		$$invalidate(1, userPw);
    	}

    	const click_handler = () => push('/regist');

    	$$self.$capture_state = () => ({
    		push,
    		match: K,
    		URL,
    		userId,
    		userPw,
    		login,
    		kakaoLogin
    	});

    	$$self.$inject_state = $$props => {
    		if ('userId' in $$props) $$invalidate(0, userId = $$props.userId);
    		if ('userPw' in $$props) $$invalidate(1, userPw = $$props.userPw);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		userId,
    		userPw,
    		login,
    		kakaoLogin,
    		input0_input_handler,
    		input1_input_handler,
    		click_handler
    	];
    }

    class Login$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\routes\user\Regist.svelte generated by Svelte v3.48.0 */
    const file$a = "src\\routes\\user\\Regist.svelte";

    function create_fragment$c(ctx) {
    	let div0;
    	let h1;
    	let t1;
    	let a;
    	let img;
    	let img_src_value;
    	let t2;
    	let div8;
    	let div7;
    	let div1;
    	let h30;
    	let label0;
    	let t4;
    	let span1;
    	let input0;
    	let t5;
    	let span0;
    	let t6;
    	let span2;
    	let t7;
    	let div2;
    	let h31;
    	let label1;
    	let t9;
    	let span3;
    	let input1;
    	let t10;
    	let span4;
    	let t11;
    	let div3;
    	let h32;
    	let label2;
    	let t13;
    	let span5;
    	let input2;
    	let t14;
    	let span6;
    	let t15;
    	let div4;
    	let h33;
    	let label3;
    	let t17;
    	let span7;
    	let input3;
    	let t18;
    	let span8;
    	let t20;
    	let div5;
    	let h34;
    	let label4;
    	let t22;
    	let span9;
    	let input4;
    	let t23;
    	let span10;
    	let t24;
    	let div6;
    	let button;
    	let span11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "회원가입 페이지";
    			t1 = space();
    			a = element("a");
    			img = element("img");
    			t2 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div1 = element("div");
    			h30 = element("h3");
    			label0 = element("label");
    			label0.textContent = "아이디";
    			t4 = space();
    			span1 = element("span");
    			input0 = element("input");
    			t5 = space();
    			span0 = element("span");
    			t6 = space();
    			span2 = element("span");
    			t7 = space();
    			div2 = element("div");
    			h31 = element("h3");
    			label1 = element("label");
    			label1.textContent = "비밀번호";
    			t9 = space();
    			span3 = element("span");
    			input1 = element("input");
    			t10 = space();
    			span4 = element("span");
    			t11 = space();
    			div3 = element("div");
    			h32 = element("h3");
    			label2 = element("label");
    			label2.textContent = "이름";
    			t13 = space();
    			span5 = element("span");
    			input2 = element("input");
    			t14 = space();
    			span6 = element("span");
    			t15 = space();
    			div4 = element("div");
    			h33 = element("h3");
    			label3 = element("label");
    			label3.textContent = "이메일";
    			t17 = space();
    			span7 = element("span");
    			input3 = element("input");
    			t18 = space();
    			span8 = element("span");
    			span8.textContent = "이메일 주소를 다시 확인해주세요.";
    			t20 = space();
    			div5 = element("div");
    			h34 = element("h3");
    			label4 = element("label");
    			label4.textContent = "휴대전화";
    			t22 = space();
    			span9 = element("span");
    			input4 = element("input");
    			t23 = space();
    			span10 = element("span");
    			t24 = space();
    			div6 = element("div");
    			button = element("button");
    			span11 = element("span");
    			span11.textContent = "가입하기";
    			attr_dev(h1, "class", "signup_title");
    			add_location(h1, file$a, 140, 4, 3967);
    			if (!src_url_equal(img.src, img_src_value = "images/logo/logo_cut.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "id", "logo");
    			attr_dev(img, "class", "svelte-1c1ehfy");
    			add_location(img, file$a, 142, 9, 4081);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "target", "_get");
    			attr_dev(a, "title", "Myshop 홈페이지 바로가기");
    			add_location(a, file$a, 141, 4, 4011);
    			attr_dev(div0, "id", "header");
    			attr_dev(div0, "class", "svelte-1c1ehfy");
    			add_location(div0, file$a, 139, 0, 3944);
    			attr_dev(label0, "for", "id");
    			add_location(label0, file$a, 153, 16, 4323);
    			attr_dev(h30, "class", "join_title svelte-1c1ehfy");
    			add_location(h30, file$a, 152, 12, 4282);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "id");
    			attr_dev(input0, "class", "int svelte-1c1ehfy");
    			attr_dev(input0, "maxlength", "20");
    			attr_dev(input0, "placeholder", "아이디를 입력하세요.");
    			add_location(input0, file$a, 156, 16, 4426);
    			attr_dev(span0, "class", "");
    			add_location(span0, file$a, 164, 16, 4689);
    			attr_dev(span1, "class", "box int_id svelte-1c1ehfy");
    			add_location(span1, file$a, 155, 12, 4383);
    			attr_dev(span2, "class", "error_next_box svelte-1c1ehfy");
    			add_location(span2, file$a, 166, 12, 4741);
    			add_location(div1, file$a, 151, 8, 4263);
    			attr_dev(label1, "for", "pw1");
    			add_location(label1, file$a, 171, 35, 4885);
    			attr_dev(h31, "class", "join_title svelte-1c1ehfy");
    			add_location(h31, file$a, 171, 12, 4862);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "pw1");
    			attr_dev(input1, "class", "int svelte-1c1ehfy");
    			attr_dev(input1, "maxlength", "20");
    			attr_dev(input1, "placeholder", "******");
    			add_location(input1, file$a, 173, 16, 4978);
    			attr_dev(span3, "class", "box int_pass svelte-1c1ehfy");
    			add_location(span3, file$a, 172, 12, 4933);
    			attr_dev(span4, "class", "error_next_box svelte-1c1ehfy");
    			add_location(span4, file$a, 182, 12, 5258);
    			add_location(div2, file$a, 170, 8, 4843);
    			attr_dev(label2, "for", "name");
    			add_location(label2, file$a, 187, 35, 5403);
    			attr_dev(h32, "class", "join_title svelte-1c1ehfy");
    			add_location(h32, file$a, 187, 12, 5380);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "id", "name");
    			attr_dev(input2, "class", "int svelte-1c1ehfy");
    			attr_dev(input2, "maxlength", "20");
    			attr_dev(input2, "placeholder", "이름을 입력하세요.");
    			add_location(input2, file$a, 189, 16, 5495);
    			attr_dev(span5, "class", "box int_name svelte-1c1ehfy");
    			add_location(span5, file$a, 188, 12, 5450);
    			attr_dev(span6, "class", "error_next_box svelte-1c1ehfy");
    			add_location(span6, file$a, 198, 12, 5774);
    			add_location(div3, file$a, 186, 8, 5361);
    			attr_dev(label3, "for", "email");
    			add_location(label3, file$a, 204, 16, 5938);
    			attr_dev(h33, "class", "join_title svelte-1c1ehfy");
    			add_location(h33, file$a, 203, 12, 5897);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "id", "email");
    			attr_dev(input3, "class", "int svelte-1c1ehfy");
    			attr_dev(input3, "maxlength", "100");
    			attr_dev(input3, "placeholder", "example@gmail.com");
    			add_location(input3, file$a, 207, 16, 6047);
    			attr_dev(span7, "class", "box int_email svelte-1c1ehfy");
    			add_location(span7, file$a, 206, 12, 6001);
    			attr_dev(span8, "class", "error_next_box svelte-1c1ehfy");
    			add_location(span8, file$a, 216, 12, 6336);
    			add_location(div4, file$a, 202, 8, 5878);
    			attr_dev(label4, "for", "phoneNo");
    			add_location(label4, file$a, 223, 35, 6538);
    			attr_dev(h34, "class", "join_title svelte-1c1ehfy");
    			add_location(h34, file$a, 223, 12, 6515);
    			attr_dev(input4, "type", "tel");
    			attr_dev(input4, "id", "mobile");
    			attr_dev(input4, "class", "int svelte-1c1ehfy");
    			attr_dev(input4, "maxlength", "16");
    			attr_dev(input4, "placeholder", "010-XXXX-XXXX");
    			add_location(input4, file$a, 225, 16, 6637);
    			attr_dev(span9, "class", "box int_mobile svelte-1c1ehfy");
    			add_location(span9, file$a, 224, 12, 6590);
    			attr_dev(span10, "class", "error_next_box svelte-1c1ehfy");
    			add_location(span10, file$a, 234, 12, 6927);
    			add_location(div5, file$a, 222, 8, 6496);
    			add_location(span11, file$a, 240, 16, 7140);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "id", "btnJoin");
    			attr_dev(button, "class", "svelte-1c1ehfy");
    			add_location(button, file$a, 239, 12, 7069);
    			attr_dev(div6, "class", "btn_area svelte-1c1ehfy");
    			add_location(div6, file$a, 238, 8, 7033);
    			attr_dev(div7, "id", "content");
    			attr_dev(div7, "class", "svelte-1c1ehfy");
    			add_location(div7, file$a, 149, 4, 4214);
    			attr_dev(div8, "id", "wrapper");
    			attr_dev(div8, "class", "svelte-1c1ehfy");
    			add_location(div8, file$a, 147, 0, 4169);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, a);
    			append_dev(a, img);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, div1);
    			append_dev(div1, h30);
    			append_dev(h30, label0);
    			append_dev(div1, t4);
    			append_dev(div1, span1);
    			append_dev(span1, input0);
    			set_input_value(input0, /*userId*/ ctx[0]);
    			append_dev(span1, t5);
    			append_dev(span1, span0);
    			append_dev(div1, t6);
    			append_dev(div1, span2);
    			/*span2_binding*/ ctx[8](span2);
    			append_dev(div7, t7);
    			append_dev(div7, div2);
    			append_dev(div2, h31);
    			append_dev(h31, label1);
    			append_dev(div2, t9);
    			append_dev(div2, span3);
    			append_dev(span3, input1);
    			set_input_value(input1, /*userPw*/ ctx[1]);
    			append_dev(div2, t10);
    			append_dev(div2, span4);
    			/*span4_binding*/ ctx[10](span4);
    			append_dev(div7, t11);
    			append_dev(div7, div3);
    			append_dev(div3, h32);
    			append_dev(h32, label2);
    			append_dev(div3, t13);
    			append_dev(div3, span5);
    			append_dev(span5, input2);
    			set_input_value(input2, /*name*/ ctx[2]);
    			append_dev(div3, t14);
    			append_dev(div3, span6);
    			/*span6_binding*/ ctx[12](span6);
    			append_dev(div7, t15);
    			append_dev(div7, div4);
    			append_dev(div4, h33);
    			append_dev(h33, label3);
    			append_dev(div4, t17);
    			append_dev(div4, span7);
    			append_dev(span7, input3);
    			set_input_value(input3, /*email*/ ctx[3]);
    			append_dev(div4, t18);
    			append_dev(div4, span8);
    			/*span8_binding*/ ctx[14](span8);
    			append_dev(div7, t20);
    			append_dev(div7, div5);
    			append_dev(div5, h34);
    			append_dev(h34, label4);
    			append_dev(div5, t22);
    			append_dev(div5, span9);
    			append_dev(span9, input4);
    			set_input_value(input4, /*phonenumber*/ ctx[4]);
    			append_dev(div5, t23);
    			append_dev(div5, span10);
    			/*span10_binding*/ ctx[16](span10);
    			append_dev(div7, t24);
    			append_dev(div7, div6);
    			append_dev(div6, button);
    			append_dev(button, span11);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a)),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[11]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[13]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[15]),
    					listen_dev(button, "click", /*regist*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*userId*/ 1 && input0.value !== /*userId*/ ctx[0]) {
    				set_input_value(input0, /*userId*/ ctx[0]);
    			}

    			if (dirty & /*userPw*/ 2 && input1.value !== /*userPw*/ ctx[1]) {
    				set_input_value(input1, /*userPw*/ ctx[1]);
    			}

    			if (dirty & /*name*/ 4 && input2.value !== /*name*/ ctx[2]) {
    				set_input_value(input2, /*name*/ ctx[2]);
    			}

    			if (dirty & /*email*/ 8 && input3.value !== /*email*/ ctx[3]) {
    				set_input_value(input3, /*email*/ ctx[3]);
    			}

    			if (dirty & /*phonenumber*/ 16) {
    				set_input_value(input4, /*phonenumber*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div8);
    			/*span2_binding*/ ctx[8](null);
    			/*span4_binding*/ ctx[10](null);
    			/*span6_binding*/ ctx[12](null);
    			/*span8_binding*/ ctx[14](null);
    			/*span10_binding*/ ctx[16](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Regist', slots, []);
    	let userId;
    	let userPw;
    	let name;
    	let email;
    	let phonenumber;
    	let error = [];

    	function checkId(userId) {
    		const idPattern = /^[a-z]+[a-z0-9]{5,19}$/;

    		if (userId === undefined || userId === '') {
    			$$invalidate(5, error[0].innerHTML = '필수 정보입니다.', error);
    			$$invalidate(5, error[0].style.display = 'block', error);
    			return false;
    		} else if (!idPattern.test(userId)) {
    			$$invalidate(5, error[0].innerHTML = '5~19자의 영문 소문자, 숫자만 사용 가능합니다.', error);
    			$$invalidate(5, error[0].style.display = 'block', error);
    			return false;
    		} else {
    			$$invalidate(5, error[0].style.display = 'none', error);
    			return true;
    		}
    	}

    	function checkPw(userPw) {
    		let pwPattern = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/;

    		if (userPw === undefined || userPw === '') {
    			$$invalidate(5, error[1].innerHTML = '필수 정보입니다.', error);
    			$$invalidate(5, error[1].style.display = 'block', error);
    			return false;
    		} else if (!pwPattern.test(userPw)) {
    			$$invalidate(5, error[1].innerHTML = '8~16자의 영문 및 숫자를 사용해 주세요.', error);
    			$$invalidate(5, error[1].style.display = 'block', error);
    			return false;
    		} else {
    			$$invalidate(5, error[1].style.display = 'none', error);
    			return true;
    		}
    	}

    	function checkName(name) {
    		var namePattern = /[가-힣]/;

    		if (name === undefined || name === '') {
    			$$invalidate(5, error[2].innerHTML = '필수 정보입니다.', error);
    			$$invalidate(5, error[2].style.display = 'block', error);
    			return false;
    		} else if (!namePattern.test(name)) {
    			$$invalidate(5, error[2].innerHTML = '한글만 입력 가능합니다.', error);
    			$$invalidate(5, error[2].style.display = 'block', error);
    			return false;
    		} else {
    			$$invalidate(5, error[2].style.display = 'none', error);
    			return true;
    		}
    	}

    	function isEmailCorrect(email) {
    		var emailPattern = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/;

    		if (email === '') {
    			$$invalidate(5, error[3].style.display = 'none', error);
    			return false;
    		} else if (!emailPattern.test(email)) {
    			$$invalidate(5, error[3].style.display = 'block', error);
    			return false;
    		} else {
    			$$invalidate(5, error[3].style.display = 'none', error);
    			return true;
    		}
    	}

    	function checkPhoneNum(phone) {
    		var isPhoneNum = /\d{3}-\d{3,4}-\d{4}$/;

    		if (phone === '') {
    			$$invalidate(5, error[4].innerHTML = '필수 정보입니다.', error);
    			$$invalidate(5, error[4].style.display = 'block', error);
    			return false;
    		} else if (!isPhoneNum.test(phone)) {
    			$$invalidate(5, error[4].innerHTML = '형식에 맞지 않는 번호입니다.', error);
    			$$invalidate(5, error[4].style.display = 'block', error);
    			return false;
    		} else {
    			$$invalidate(5, error[4].style.display = 'none', error);
    			return true;
    		}
    	}

    	const regist = async () => {
    		const validation = {
    			userId: checkId(userId),
    			userPw: checkPw(userPw),
    			name: checkName(name),
    			email: isEmailCorrect(email),
    			phone: checkPhoneNum(phonenumber)
    		};

    		if (validation.userId && validation.userPw && validation.name && validation.email && validation.phone) {
    			const res = await fetch(`${URL}/api/v1/user`, {
    				method: 'POST',
    				headers: {
    					'Content-Type': 'application/json',
    					'Data-Type': 'json'
    				},
    				body: JSON.stringify({ userId, userPw, name, email, phonenumber })
    			});

    			K(res).with({ status: 201 }, () => {
    				alert('회원가입이 완료되었습니다.');
    				push('/');
    			}).with({ status: 422 }, async () => {
    				const jsonBody = await res.json();
    				alert(jsonBody.error);
    			}).with({ status: 400 }, async () => {
    				const jsonBody = await res.json();
    				alert(jsonBody.error);
    			}).exhaustive();
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Regist> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		userId = this.value;
    		$$invalidate(0, userId);
    	}

    	function span2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			error[0] = $$value;
    			$$invalidate(5, error);
    		});
    	}

    	function input1_input_handler() {
    		userPw = this.value;
    		$$invalidate(1, userPw);
    	}

    	function span4_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			error[1] = $$value;
    			$$invalidate(5, error);
    		});
    	}

    	function input2_input_handler() {
    		name = this.value;
    		$$invalidate(2, name);
    	}

    	function span6_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			error[2] = $$value;
    			$$invalidate(5, error);
    		});
    	}

    	function input3_input_handler() {
    		email = this.value;
    		$$invalidate(3, email);
    	}

    	function span8_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			error[3] = $$value;
    			$$invalidate(5, error);
    		});
    	}

    	function input4_input_handler() {
    		phonenumber = this.value;
    		$$invalidate(4, phonenumber);
    	}

    	function span10_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			error[4] = $$value;
    			$$invalidate(5, error);
    		});
    	}

    	$$self.$capture_state = () => ({
    		match: K,
    		URL,
    		push,
    		link,
    		userId,
    		userPw,
    		name,
    		email,
    		phonenumber,
    		error,
    		checkId,
    		checkPw,
    		checkName,
    		isEmailCorrect,
    		checkPhoneNum,
    		regist
    	});

    	$$self.$inject_state = $$props => {
    		if ('userId' in $$props) $$invalidate(0, userId = $$props.userId);
    		if ('userPw' in $$props) $$invalidate(1, userPw = $$props.userPw);
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('email' in $$props) $$invalidate(3, email = $$props.email);
    		if ('phonenumber' in $$props) $$invalidate(4, phonenumber = $$props.phonenumber);
    		if ('error' in $$props) $$invalidate(5, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		userId,
    		userPw,
    		name,
    		email,
    		phonenumber,
    		error,
    		regist,
    		input0_input_handler,
    		span2_binding,
    		input1_input_handler,
    		span4_binding,
    		input2_input_handler,
    		span6_binding,
    		input3_input_handler,
    		span8_binding,
    		input4_input_handler,
    		span10_binding
    	];
    }

    class Regist$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Regist",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\components\user\CheckProfile.svelte generated by Svelte v3.48.0 */
    const file$9 = "src\\components\\user\\CheckProfile.svelte";

    function create_fragment$b(ctx) {
    	let div8;
    	let div7;
    	let h2;
    	let t1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t2;
    	let h3;
    	let t4;
    	let section;
    	let div2;
    	let div1;
    	let i0;
    	let t5;
    	let input0;
    	let input0_value_value;
    	let t6;
    	let div4;
    	let div3;
    	let i1;
    	let t7;
    	let input1;
    	let t8;
    	let div5;
    	let button0;
    	let t10;
    	let div6;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div7 = element("div");
    			h2 = element("h2");
    			h2.textContent = "회원정보 확인";
    			t1 = space();
    			div0 = element("div");
    			img = element("img");
    			t2 = space();
    			h3 = element("h3");
    			h3.textContent = "개인정보 조회를 위해 비밀번호를 입력해주세요.";
    			t4 = space();
    			section = element("section");
    			div2 = element("div");
    			div1 = element("div");
    			i0 = element("i");
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			div4 = element("div");
    			div3 = element("div");
    			i1 = element("i");
    			t7 = space();
    			input1 = element("input");
    			t8 = space();
    			div5 = element("div");
    			button0 = element("button");
    			button0.textContent = "확인";
    			t10 = space();
    			div6 = element("div");
    			button1 = element("button");
    			button1.textContent = "취소";
    			attr_dev(h2, "class", "mem-check-tit svelte-1rsiid6");
    			add_location(h2, file$9, 37, 8, 941);
    			if (!src_url_equal(img.src, img_src_value = "./images/logo/logosmall2.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "250");
    			attr_dev(img, "height", "100");
    			add_location(img, file$9, 39, 12, 1028);
    			attr_dev(div0, "class", "member-logo svelte-1rsiid6");
    			add_location(div0, file$9, 38, 8, 989);
    			attr_dev(h3, "class", "svelte-1rsiid6");
    			add_location(h3, file$9, 41, 8, 1121);
    			attr_dev(i0, "class", "fa fa-user");
    			add_location(i0, file$9, 45, 20, 1312);
    			input0.disabled = true;
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", " ID");
    			input0.value = input0_value_value = " " + /*userId*/ ctx[1];
    			attr_dev(input0, "class", "svelte-1rsiid6");
    			add_location(input0, file$9, 46, 20, 1358);
    			attr_dev(div1, "class", "id_icon svelte-1rsiid6");
    			add_location(div1, file$9, 44, 16, 1269);
    			attr_dev(div2, "class", "login-input-wrap svelte-1rsiid6");
    			add_location(div2, file$9, 43, 12, 1221);
    			attr_dev(i1, "class", "fa fa-lock");
    			add_location(i1, file$9, 56, 20, 1718);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "placeholder", " Password");
    			attr_dev(input1, "class", "svelte-1rsiid6");
    			add_location(input1, file$9, 57, 20, 1764);
    			attr_dev(div3, "class", "pw_icon svelte-1rsiid6");
    			add_location(div3, file$9, 55, 16, 1675);
    			attr_dev(div4, "class", "login-input-wrap password-wrap svelte-1rsiid6");
    			add_location(div4, file$9, 54, 12, 1613);
    			attr_dev(button0, "id", "login");
    			attr_dev(button0, "class", "svelte-1rsiid6");
    			add_location(button0, file$9, 65, 16, 2041);
    			attr_dev(div5, "class", "login-button-wrap svelte-1rsiid6");
    			add_location(div5, file$9, 64, 12, 1992);
    			attr_dev(button1, "id", "cancel");
    			attr_dev(button1, "class", "svelte-1rsiid6");
    			add_location(button1, file$9, 68, 16, 2172);
    			attr_dev(div6, "class", "cancel-button-wrap svelte-1rsiid6");
    			add_location(div6, file$9, 67, 12, 2122);
    			attr_dev(section, "class", "login-input-section-wrap svelte-1rsiid6");
    			add_location(section, file$9, 42, 8, 1165);
    			attr_dev(div7, "class", "member-container svelte-1rsiid6");
    			add_location(div7, file$9, 36, 4, 901);
    			attr_dev(div8, "class", "mypage_container svelte-1rsiid6");
    			add_location(div8, file$9, 35, 0, 865);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, h2);
    			append_dev(div7, t1);
    			append_dev(div7, div0);
    			append_dev(div0, img);
    			append_dev(div7, t2);
    			append_dev(div7, h3);
    			append_dev(div7, t4);
    			append_dev(div7, section);
    			append_dev(section, div2);
    			append_dev(div2, div1);
    			append_dev(div1, i0);
    			append_dev(div1, t5);
    			append_dev(div1, input0);
    			append_dev(section, t6);
    			append_dev(section, div4);
    			append_dev(div4, div3);
    			append_dev(div3, i1);
    			append_dev(div3, t7);
    			append_dev(div3, input1);
    			set_input_value(input1, /*userPw*/ ctx[0]);
    			append_dev(section, t8);
    			append_dev(section, div5);
    			append_dev(div5, button0);
    			append_dev(section, t10);
    			append_dev(section, div6);
    			append_dev(div6, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[4]),
    					listen_dev(button0, "click", /*login*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", pop, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*userId*/ 2 && input0_value_value !== (input0_value_value = " " + /*userId*/ ctx[1]) && input0.value !== input0_value_value) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*userPw*/ 1 && input1.value !== /*userPw*/ ctx[0]) {
    				set_input_value(input1, /*userPw*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CheckProfile', slots, []);
    	let { checked } = $$props;
    	let { userPw } = $$props;
    	let userId;

    	onMount(() => {
    		$$invalidate(1, userId = localStorage.getItem('userId'));

    		if (!userId) {
    			alert('로그인 후 이용 가능합니다.');
    			return;
    		}
    	});

    	const login = async () => {
    		const res = await fetch(`${URL$1}/api/v1/user/login`, {
    			method: 'POST',
    			headers: { 'Content-Type': 'application/json' },
    			body: JSON.stringify({ userId, userPw })
    		});

    		if (res.status === 200) {
    			const token = res.headers.get('Authorization');
    			localStorage.setItem('token', token);
    			$$invalidate(3, checked = true);
    		} else {
    			alert('회원정보가 일치하지 않습니다!');
    		}
    	};

    	const writable_props = ['checked', 'userPw'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CheckProfile> was created with unknown prop '${key}'`);
    	});

    	function input1_input_handler() {
    		userPw = this.value;
    		$$invalidate(0, userPw);
    	}

    	$$self.$$set = $$props => {
    		if ('checked' in $$props) $$invalidate(3, checked = $$props.checked);
    		if ('userPw' in $$props) $$invalidate(0, userPw = $$props.userPw);
    	};

    	$$self.$capture_state = () => ({
    		checked,
    		userPw,
    		onMount,
    		pop,
    		URL: URL$1,
    		userId,
    		login
    	});

    	$$self.$inject_state = $$props => {
    		if ('checked' in $$props) $$invalidate(3, checked = $$props.checked);
    		if ('userPw' in $$props) $$invalidate(0, userPw = $$props.userPw);
    		if ('userId' in $$props) $$invalidate(1, userId = $$props.userId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [userPw, userId, login, checked, input1_input_handler];
    }

    class CheckProfile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { checked: 3, userPw: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CheckProfile",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*checked*/ ctx[3] === undefined && !('checked' in props)) {
    			console.warn("<CheckProfile> was created without expected prop 'checked'");
    		}

    		if (/*userPw*/ ctx[0] === undefined && !('userPw' in props)) {
    			console.warn("<CheckProfile> was created without expected prop 'userPw'");
    		}
    	}

    	get checked() {
    		throw new Error("<CheckProfile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<CheckProfile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userPw() {
    		throw new Error("<CheckProfile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userPw(value) {
    		throw new Error("<CheckProfile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\user\Profile.svelte generated by Svelte v3.48.0 */

    const { Object: Object_1 } = globals;
    const file$8 = "src\\components\\user\\Profile.svelte";

    // (87:0) {#if userInfo}
    function create_if_block$4(ctx) {
    	let div17;
    	let div16;
    	let h2;
    	let t1;
    	let div12;
    	let input0;
    	let t2;
    	let label0;
    	let span0;
    	let t4;
    	let input1;
    	let t5;
    	let label1;
    	let span1;
    	let t7;
    	let div11;
    	let form;
    	let div10;
    	let div1;
    	let label2;
    	let t9;
    	let div0;
    	let span2;
    	let t11;
    	let hr0;
    	let t12;
    	let div3;
    	let label3;
    	let t14;
    	let div2;
    	let input2;
    	let t15;
    	let div5;
    	let label4;
    	let t17;
    	let div4;
    	let input3;
    	let t18;
    	let hr1;
    	let t19;
    	let div7;
    	let label5;
    	let t21;
    	let div6;
    	let span3;
    	let t22_value = /*userInfo*/ ctx[2].email + "";
    	let t22;
    	let t23;
    	let hr2;
    	let t24;
    	let div9;
    	let label6;
    	let t26;
    	let div8;
    	let span4;
    	let t27_value = /*userInfo*/ ctx[2].phonenumber + "";
    	let t27;
    	let t28;
    	let hr3;
    	let t29;
    	let div15;
    	let div13;
    	let button0;
    	let t31;
    	let div14;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div17 = element("div");
    			div16 = element("div");
    			h2 = element("h2");
    			h2.textContent = "회원정보 관리";
    			t1 = space();
    			div12 = element("div");
    			input0 = element("input");
    			t2 = space();
    			label0 = element("label");
    			span0 = element("span");
    			span0.textContent = "주문조회";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			label1 = element("label");
    			span1 = element("span");
    			span1.textContent = "회원정보 관리";
    			t7 = space();
    			div11 = element("div");
    			form = element("form");
    			div10 = element("div");
    			div1 = element("div");
    			label2 = element("label");
    			label2.textContent = "아이디";
    			t9 = space();
    			div0 = element("div");
    			span2 = element("span");
    			span2.textContent = `${/*userId*/ ctx[3]}`;
    			t11 = space();
    			hr0 = element("hr");
    			t12 = space();
    			div3 = element("div");
    			label3 = element("label");
    			label3.textContent = "이름";
    			t14 = space();
    			div2 = element("div");
    			input2 = element("input");
    			t15 = space();
    			div5 = element("div");
    			label4 = element("label");
    			label4.textContent = "비밀번호";
    			t17 = space();
    			div4 = element("div");
    			input3 = element("input");
    			t18 = space();
    			hr1 = element("hr");
    			t19 = space();
    			div7 = element("div");
    			label5 = element("label");
    			label5.textContent = "이메일";
    			t21 = space();
    			div6 = element("div");
    			span3 = element("span");
    			t22 = text(t22_value);
    			t23 = space();
    			hr2 = element("hr");
    			t24 = space();
    			div9 = element("div");
    			label6 = element("label");
    			label6.textContent = "핸드폰 번호";
    			t26 = space();
    			div8 = element("div");
    			span4 = element("span");
    			t27 = text(t27_value);
    			t28 = space();
    			hr3 = element("hr");
    			t29 = space();
    			div15 = element("div");
    			div13 = element("div");
    			button0 = element("button");
    			button0.textContent = "저장하기";
    			t31 = space();
    			div14 = element("div");
    			button1 = element("button");
    			button1.textContent = "취소하기";
    			attr_dev(h2, "class", "mem-check-tit svelte-ljt978");
    			add_location(h2, file$8, 89, 12, 2507);
    			attr_dev(input0, "id", "order-check");
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "name", "tab_item");
    			input0.disabled = true;
    			attr_dev(input0, "class", "svelte-ljt978");
    			add_location(input0, file$8, 91, 16, 2595);
    			add_location(span0, file$8, 93, 21, 2741);
    			attr_dev(label0, "class", "tab_item svelte-ljt978");
    			attr_dev(label0, "for", "order-check");
    			add_location(label0, file$8, 92, 16, 2677);
    			attr_dev(input1, "id", "profile-info");
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", "tab_item");
    			input1.checked = true;
    			attr_dev(input1, "class", "svelte-ljt978");
    			add_location(input1, file$8, 95, 16, 2822);
    			add_location(span1, file$8, 97, 21, 2969);
    			attr_dev(label1, "class", "tab_item svelte-ljt978");
    			attr_dev(label1, "for", "profile-info");
    			add_location(label1, file$8, 96, 16, 2904);
    			attr_dev(label2, "for", "login_ID");
    			attr_dev(label2, "class", "input-label svelte-ljt978");
    			add_location(label2, file$8, 103, 32, 3265);
    			add_location(span2, file$8, 107, 36, 3490);
    			attr_dev(div0, "class", "input-disabled");
    			add_location(div0, file$8, 106, 32, 3424);
    			attr_dev(div1, "class", "login_ID svelte-ljt978");
    			add_location(div1, file$8, 102, 28, 3209);
    			add_location(hr0, file$8, 110, 28, 3617);
    			attr_dev(label3, "for", "name");
    			attr_dev(label3, "class", "input-label svelte-ljt978");
    			add_location(label3, file$8, 112, 32, 3710);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "id", "name");
    			attr_dev(input2, "class", "form_control svelte-ljt978");
    			add_location(input2, file$8, 116, 36, 3927);
    			attr_dev(div2, "class", "input-outer svelte-ljt978");
    			add_location(div2, file$8, 115, 32, 3864);
    			attr_dev(div3, "class", "name-form svelte-ljt978");
    			add_location(div3, file$8, 111, 28, 3653);
    			attr_dev(label4, "for", "pw");
    			attr_dev(label4, "class", "input-label svelte-ljt978");
    			add_location(label4, file$8, 125, 32, 4359);
    			attr_dev(input3, "type", "password");
    			attr_dev(input3, "id", "pw");
    			attr_dev(input3, "class", "form_control svelte-ljt978");
    			input3.value = /*userPw*/ ctx[0];
    			add_location(input3, file$8, 129, 36, 4576);
    			attr_dev(div4, "class", "input-outer svelte-ljt978");
    			add_location(div4, file$8, 128, 32, 4513);
    			attr_dev(div5, "class", "pw-form svelte-ljt978");
    			add_location(div5, file$8, 124, 28, 4304);
    			add_location(hr1, file$8, 137, 28, 4952);
    			attr_dev(label5, "for", "email");
    			attr_dev(label5, "class", "input-label svelte-ljt978");
    			add_location(label5, file$8, 139, 32, 5046);
    			add_location(span3, file$8, 143, 36, 5268);
    			attr_dev(div6, "class", "input-disabled");
    			add_location(div6, file$8, 142, 32, 5202);
    			attr_dev(div7, "class", "Email-form svelte-ljt978");
    			add_location(div7, file$8, 138, 28, 4988);
    			add_location(hr2, file$8, 146, 28, 5403);
    			attr_dev(label6, "for", "phone");
    			attr_dev(label6, "class", "input-label svelte-ljt978");
    			add_location(label6, file$8, 148, 32, 5497);
    			add_location(span4, file$8, 152, 36, 5722);
    			attr_dev(div8, "class", "input-disabled");
    			add_location(div8, file$8, 151, 32, 5656);
    			attr_dev(div9, "class", "phone-form svelte-ljt978");
    			add_location(div9, file$8, 147, 28, 5439);
    			add_location(hr3, file$8, 155, 28, 5863);
    			attr_dev(div10, "class", "Setting-profile svelte-ljt978");
    			add_location(div10, file$8, 101, 24, 3150);
    			attr_dev(form, "class", "mem-form svelte-ljt978");
    			add_location(form, file$8, 100, 20, 3101);
    			attr_dev(div11, "class", "tab_content svelte-ljt978");
    			attr_dev(div11, "id", "profile_content");
    			add_location(div11, file$8, 99, 16, 3033);
    			attr_dev(div12, "class", "tabs svelte-ljt978");
    			add_location(div12, file$8, 90, 12, 2559);
    			attr_dev(button0, "id", "save");
    			attr_dev(button0, "class", "svelte-ljt978");
    			add_location(button0, file$8, 163, 20, 6074);
    			attr_dev(div13, "class", "save-btn svelte-ljt978");
    			add_location(div13, file$8, 162, 16, 6030);
    			attr_dev(button1, "id", "cancel");
    			attr_dev(button1, "class", "svelte-ljt978");
    			add_location(button1, file$8, 166, 20, 6211);
    			attr_dev(div14, "class", "cancel-btn svelte-ljt978");
    			add_location(div14, file$8, 165, 16, 6165);
    			attr_dev(div15, "class", "btn-area svelte-ljt978");
    			add_location(div15, file$8, 161, 12, 5990);
    			attr_dev(div16, "class", "member-container svelte-ljt978");
    			add_location(div16, file$8, 88, 8, 2463);
    			attr_dev(div17, "class", "mypage_container svelte-ljt978");
    			add_location(div17, file$8, 87, 4, 2423);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div17, anchor);
    			append_dev(div17, div16);
    			append_dev(div16, h2);
    			append_dev(div16, t1);
    			append_dev(div16, div12);
    			append_dev(div12, input0);
    			append_dev(div12, t2);
    			append_dev(div12, label0);
    			append_dev(label0, span0);
    			append_dev(div12, t4);
    			append_dev(div12, input1);
    			append_dev(div12, t5);
    			append_dev(div12, label1);
    			append_dev(label1, span1);
    			append_dev(div12, t7);
    			append_dev(div12, div11);
    			append_dev(div11, form);
    			append_dev(form, div10);
    			append_dev(div10, div1);
    			append_dev(div1, label2);
    			append_dev(div1, t9);
    			append_dev(div1, div0);
    			append_dev(div0, span2);
    			append_dev(div10, t11);
    			append_dev(div10, hr0);
    			append_dev(div10, t12);
    			append_dev(div10, div3);
    			append_dev(div3, label3);
    			append_dev(div3, t14);
    			append_dev(div3, div2);
    			append_dev(div2, input2);
    			set_input_value(input2, /*name*/ ctx[1]);
    			append_dev(div10, t15);
    			append_dev(div10, div5);
    			append_dev(div5, label4);
    			append_dev(div5, t17);
    			append_dev(div5, div4);
    			append_dev(div4, input3);
    			append_dev(div10, t18);
    			append_dev(div10, hr1);
    			append_dev(div10, t19);
    			append_dev(div10, div7);
    			append_dev(div7, label5);
    			append_dev(div7, t21);
    			append_dev(div7, div6);
    			append_dev(div6, span3);
    			append_dev(span3, t22);
    			append_dev(div10, t23);
    			append_dev(div10, hr2);
    			append_dev(div10, t24);
    			append_dev(div10, div9);
    			append_dev(div9, label6);
    			append_dev(div9, t26);
    			append_dev(div9, div8);
    			append_dev(div8, span4);
    			append_dev(span4, t27);
    			append_dev(div10, t28);
    			append_dev(div10, hr3);
    			append_dev(div16, t29);
    			append_dev(div16, div15);
    			append_dev(div15, div13);
    			append_dev(div13, button0);
    			append_dev(div15, t31);
    			append_dev(div15, div14);
    			append_dev(div14, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", /*setState*/ ctx[5], false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen_dev(button0, "click", /*update*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", pop, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*name*/ 2 && input2.value !== /*name*/ ctx[1]) {
    				set_input_value(input2, /*name*/ ctx[1]);
    			}

    			if (dirty & /*userPw*/ 1 && input3.value !== /*userPw*/ ctx[0]) {
    				prop_dev(input3, "value", /*userPw*/ ctx[0]);
    			}

    			if (dirty & /*userInfo*/ 4 && t22_value !== (t22_value = /*userInfo*/ ctx[2].email + "")) set_data_dev(t22, t22_value);
    			if (dirty & /*userInfo*/ 4 && t27_value !== (t27_value = /*userInfo*/ ctx[2].phonenumber + "")) set_data_dev(t27, t27_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div17);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(87:0) {#if userInfo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let link;
    	let t;
    	let if_block_anchor;
    	let if_block = /*userInfo*/ ctx[2] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			link = element("link");
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://use.fontawesome.com/releases/v5.6.3/css/all.css");
    			attr_dev(link, "integrity", "sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/");
    			attr_dev(link, "crossorigin", "anonymous");
    			add_location(link, file$8, 78, 4, 2146);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*userInfo*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Profile', slots, []);
    	let { state } = $$props;
    	let { userPw } = $$props;
    	let name;
    	const userId = localStorage.getItem('userId');
    	let userInfo;

    	onMount(async () => {
    		const token = localStorage.getItem('token');

    		if (token && userId) {
    			const res = await fetch(`${URL$1}/api/v1/user/${userId}`, {
    				method: 'GET',
    				headers: {
    					'Content-Type': 'application/json',
    					Authorization: token
    				}
    			});

    			if (res.status === 200) {
    				$$invalidate(2, userInfo = await res.json());
    				$$invalidate(1, name = userInfo.name);
    			} else if (res.status === 401) {
    				alert('로그인 후 이용 가능합니다.');
    				localStorage.clear();
    				pop();
    			} else {
    				alert('개인정보를 불러오지 못했습니다.');
    				pop();
    			}
    		} else {
    			alert('로그인 후 이용 가능합니다.');
    			pop();
    		}
    	});

    	const update = async () => {
    		const userId = localStorage.getItem('userId');
    		const token = localStorage.getItem('token');

    		if (userId && token) {
    			const res = await fetch(`${URL$1}/api/v1/user/${userId}`, {
    				method: 'PUT',
    				headers: {
    					'Content-Type': 'application/json',
    					Authorization: token
    				},
    				body: JSON.stringify(Object.assign(Object.assign({}, userPw && { userPw }), name && { name }))
    			});

    			if (res.status === 200) {
    				alert('개인정보가 변경되었습니다.');
    				pop();
    			} else if (res.status === 401) {
    				alert('로그인이 필요합니다.');
    				localStorage.clear();
    				pop();
    			} else if (res.status === 400) {
    				alert('개인정보를 변경하지 못했습니다.');
    				pop();
    			} else {
    				alert('일시적인 오류가 발생했습니다.');
    				pop();
    			}
    		} else {
    			alert('로그인이 필요합니다.');
    			pop();
    		}
    	};

    	const setState = () => {
    		$$invalidate(6, state = 'orders');
    	};

    	const writable_props = ['state', 'userPw'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Profile> was created with unknown prop '${key}'`);
    	});

    	function input2_input_handler() {
    		name = this.value;
    		$$invalidate(1, name);
    	}

    	$$self.$$set = $$props => {
    		if ('state' in $$props) $$invalidate(6, state = $$props.state);
    		if ('userPw' in $$props) $$invalidate(0, userPw = $$props.userPw);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		pop,
    		URL: URL$1,
    		state,
    		userPw,
    		name,
    		userId,
    		userInfo,
    		update,
    		setState
    	});

    	$$self.$inject_state = $$props => {
    		if ('state' in $$props) $$invalidate(6, state = $$props.state);
    		if ('userPw' in $$props) $$invalidate(0, userPw = $$props.userPw);
    		if ('name' in $$props) $$invalidate(1, name = $$props.name);
    		if ('userInfo' in $$props) $$invalidate(2, userInfo = $$props.userInfo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [userPw, name, userInfo, userId, update, setState, state, input2_input_handler];
    }

    class Profile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { state: 6, userPw: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Profile",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*state*/ ctx[6] === undefined && !('state' in props)) {
    			console.warn("<Profile> was created without expected prop 'state'");
    		}

    		if (/*userPw*/ ctx[0] === undefined && !('userPw' in props)) {
    			console.warn("<Profile> was created without expected prop 'userPw'");
    		}
    	}

    	get state() {
    		throw new Error("<Profile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Profile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userPw() {
    		throw new Error("<Profile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userPw(value) {
    		throw new Error("<Profile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\user\Orders.svelte generated by Svelte v3.48.0 */

    const { console: console_1$1 } = globals;
    const file$7 = "src\\components\\user\\Orders.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (52:0) {#if orders}
    function create_if_block$3(ctx) {
    	let div5;
    	let div4;
    	let h2;
    	let t1;
    	let div3;
    	let input0;
    	let t2;
    	let label0;
    	let span0;
    	let t4;
    	let input1;
    	let t5;
    	let label1;
    	let span1;
    	let t7;
    	let div0;
    	let t8;
    	let div2;
    	let div1;
    	let mounted;
    	let dispose;
    	let each_value = /*orders*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			h2 = element("h2");
    			h2.textContent = "주문 조회";
    			t1 = space();
    			div3 = element("div");
    			input0 = element("input");
    			t2 = space();
    			label0 = element("label");
    			span0 = element("span");
    			span0.textContent = "주문조회";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			label1 = element("label");
    			span1 = element("span");
    			span1.textContent = "회원정보 관리";
    			t7 = space();
    			div0 = element("div");
    			t8 = space();
    			div2 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "order-check-tit svelte-ktd85u");
    			add_location(h2, file$7, 54, 12, 1593);
    			attr_dev(input0, "id", "order-check");
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "name", "tab_item");
    			input0.checked = true;
    			attr_dev(input0, "class", "svelte-ktd85u");
    			add_location(input0, file$7, 56, 16, 1681);
    			add_location(span0, file$7, 58, 21, 1826);
    			attr_dev(label0, "class", "tab_item svelte-ktd85u");
    			attr_dev(label0, "for", "order-check");
    			add_location(label0, file$7, 57, 16, 1762);
    			attr_dev(input1, "id", "profile-info");
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", "tab_item");
    			input1.disabled = true;
    			attr_dev(input1, "class", "svelte-ktd85u");
    			add_location(input1, file$7, 60, 16, 1887);
    			add_location(span1, file$7, 67, 21, 2136);
    			attr_dev(label1, "class", "tab_item svelte-ktd85u");
    			attr_dev(label1, "for", "profile-info");
    			add_location(label1, file$7, 66, 16, 2071);
    			attr_dev(div0, "class", "tab_content svelte-ktd85u");
    			attr_dev(div0, "id", "profile_content");
    			add_location(div0, file$7, 69, 16, 2220);
    			attr_dev(div1, "class", "order-container svelte-ktd85u");
    			add_location(div1, file$7, 73, 20, 2422);
    			attr_dev(div2, "class", "tab_content svelte-ktd85u");
    			attr_dev(div2, "id", "order-check-content");
    			add_location(div2, file$7, 72, 16, 2350);
    			attr_dev(div3, "class", "tabs svelte-ktd85u");
    			add_location(div3, file$7, 55, 12, 1645);
    			attr_dev(div4, "class", "member-container svelte-ktd85u");
    			add_location(div4, file$7, 53, 8, 1549);
    			attr_dev(div5, "class", "mypage_container svelte-ktd85u");
    			add_location(div5, file$7, 52, 4, 1509);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, h2);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, input0);
    			append_dev(div3, t2);
    			append_dev(div3, label0);
    			append_dev(label0, span0);
    			append_dev(div3, t4);
    			append_dev(div3, input1);
    			append_dev(div3, t5);
    			append_dev(div3, label1);
    			append_dev(label1, span1);
    			append_dev(div3, t7);
    			append_dev(div3, div0);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(span1, "click", /*setState*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*orders*/ 1) {
    				each_value = /*orders*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(52:0) {#if orders}",
    		ctx
    	});

    	return block;
    }

    // (77:28) {#each order.products as product}
    function create_each_block_1$1(ctx) {
    	let div8;
    	let div4;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div3;
    	let div1;
    	let t1_value = /*product*/ ctx[6].name + "";
    	let t1;
    	let t2;
    	let div2;
    	let t3_value = /*product*/ ctx[6].details + "";
    	let t3;
    	let t4;
    	let div7;
    	let h3;
    	let t6;
    	let div5;
    	let i;
    	let t7;
    	let div6;
    	let t9;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div2 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div7 = element("div");
    			h3 = element("h3");
    			h3.textContent = "배송상태";
    			t6 = space();
    			div5 = element("div");
    			i = element("i");
    			t7 = space();
    			div6 = element("div");
    			div6.textContent = "배송중";
    			t9 = space();
    			if (!src_url_equal(img.src, img_src_value = /*product*/ ctx[6].thumbnail)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*product*/ ctx[6].name);
    			attr_dev(img, "width", "120");
    			attr_dev(img, "height", "120");
    			add_location(img, file$7, 80, 44, 2868);
    			attr_dev(div0, "class", "img-box svelte-ktd85u");
    			add_location(div0, file$7, 79, 40, 2801);
    			attr_dev(div1, "class", "goods_tit svelte-ktd85u");
    			add_location(div1, file$7, 88, 44, 3338);
    			attr_dev(div2, "class", "detail svelte-ktd85u");
    			add_location(div2, file$7, 91, 44, 3523);
    			attr_dev(div3, "class", "info svelte-ktd85u");
    			add_location(div3, file$7, 87, 40, 3274);
    			attr_dev(div4, "class", "goods svelte-ktd85u");
    			add_location(div4, file$7, 78, 36, 2740);
    			add_location(h3, file$7, 98, 40, 3865);
    			attr_dev(i, "class", "fa fa-truck");
    			add_location(i, file$7, 100, 44, 3993);
    			attr_dev(div5, "class", "delivery-icon svelte-ktd85u");
    			add_location(div5, file$7, 99, 40, 3920);
    			add_location(div6, file$7, 102, 40, 4108);
    			attr_dev(div7, "class", "delivery_status svelte-ktd85u");
    			add_location(div7, file$7, 97, 36, 3794);
    			attr_dev(div8, "class", "order-content svelte-ktd85u");
    			add_location(div8, file$7, 77, 32, 2675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div4);
    			append_dev(div4, div0);
    			append_dev(div0, img);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, t3);
    			append_dev(div8, t4);
    			append_dev(div8, div7);
    			append_dev(div7, h3);
    			append_dev(div7, t6);
    			append_dev(div7, div5);
    			append_dev(div5, i);
    			append_dev(div7, t7);
    			append_dev(div7, div6);
    			append_dev(div8, t9);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*orders*/ 1 && !src_url_equal(img.src, img_src_value = /*product*/ ctx[6].thumbnail)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*orders*/ 1 && img_alt_value !== (img_alt_value = /*product*/ ctx[6].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*orders*/ 1 && t1_value !== (t1_value = /*product*/ ctx[6].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*orders*/ 1 && t3_value !== (t3_value = /*product*/ ctx[6].details + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(77:28) {#each order.products as product}",
    		ctx
    	});

    	return block;
    }

    // (75:24) {#each orders as order}
    function create_each_block$2(ctx) {
    	let h3;
    	let t0_value = /*order*/ ctx[3].orderDate + "";
    	let t0;
    	let t1;
    	let t2;
    	let each_1_anchor;
    	let each_value_1 = /*order*/ ctx[3].products;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = text(" 주문");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(h3, "class", "order-date");
    			add_location(h3, file$7, 75, 28, 2530);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			insert_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*orders*/ 1 && t0_value !== (t0_value = /*order*/ ctx[3].orderDate + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*orders*/ 1) {
    				each_value_1 = /*order*/ ctx[3].products;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(75:24) {#each orders as order}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*orders*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*orders*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Orders', slots, []);
    	let { state } = $$props;

    	const setState = () => {
    		$$invalidate(2, state = 'profile');
    	};

    	let orders;

    	onMount(async () => {
    		const userId = localStorage.getItem('userId');
    		const token = localStorage.getItem('token');

    		if (userId && token) {
    			const res = await fetch(`${URL$1}/api/v1/user/${userId}/order`, {
    				method: 'GET',
    				headers: {
    					'Content-Type': 'application/json',
    					Authorization: token
    				}
    			});

    			if (res.status === 200) {
    				$$invalidate(0, orders = await res.json());
    				console.log(orders);
    			} else if (res.status === 401) {
    				alert('로그인 후 이용 가능합니다');
    				localStorage.clear();
    				pop();
    			} else {
    				alert('주문 정보를 불러오지 못했습니다.');
    				pop();
    			}
    		} else {
    			alert('로그인 후 이용 가능합니다.');
    			pop();
    		}
    	});

    	const writable_props = ['state'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Orders> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('state' in $$props) $$invalidate(2, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		pop,
    		URL: URL$1,
    		state,
    		setState,
    		orders
    	});

    	$$self.$inject_state = $$props => {
    		if ('state' in $$props) $$invalidate(2, state = $$props.state);
    		if ('orders' in $$props) $$invalidate(0, orders = $$props.orders);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*orders*/ 1) {
    			$$invalidate(0, orders = orders === null || orders === void 0
    			? void 0
    			: orders.map(order => {
    					order.products = order.products.map(product => {
    						product.details = product.details.map(detail => detail.name).reduce((a, b) => a + ' / ' + b);
    						return product;
    					});

    					const date = new Date(order.orderDate);
    					order.orderDate = date.toLocaleString();
    					return order;
    				}));
    		}
    	};

    	return [orders, setState, state];
    }

    class Orders extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { state: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Orders",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*state*/ ctx[2] === undefined && !('state' in props)) {
    			console_1$1.warn("<Orders> was created without expected prop 'state'");
    		}
    	}

    	get state() {
    		throw new Error("<Orders>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Orders>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\routes\user\Mypage.svelte generated by Svelte v3.48.0 */

    // (13:41) 
    function create_if_block_2(ctx) {
    	let profile;
    	let updating_state;
    	let updating_userPw;
    	let current;

    	function profile_state_binding(value) {
    		/*profile_state_binding*/ ctx[6](value);
    	}

    	function profile_userPw_binding(value) {
    		/*profile_userPw_binding*/ ctx[7](value);
    	}

    	let profile_props = {};

    	if (/*state*/ ctx[0] !== void 0) {
    		profile_props.state = /*state*/ ctx[0];
    	}

    	if (/*userPw*/ ctx[2] !== void 0) {
    		profile_props.userPw = /*userPw*/ ctx[2];
    	}

    	profile = new Profile({ props: profile_props, $$inline: true });
    	binding_callbacks.push(() => bind(profile, 'state', profile_state_binding));
    	binding_callbacks.push(() => bind(profile, 'userPw', profile_userPw_binding));

    	const block = {
    		c: function create() {
    			create_component(profile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(profile, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const profile_changes = {};

    			if (!updating_state && dirty & /*state*/ 1) {
    				updating_state = true;
    				profile_changes.state = /*state*/ ctx[0];
    				add_flush_callback(() => updating_state = false);
    			}

    			if (!updating_userPw && dirty & /*userPw*/ 4) {
    				updating_userPw = true;
    				profile_changes.userPw = /*userPw*/ ctx[2];
    				add_flush_callback(() => updating_userPw = false);
    			}

    			profile.$set(profile_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(profile.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(profile.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(profile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(13:41) ",
    		ctx
    	});

    	return block;
    }

    // (11:42) 
    function create_if_block_1(ctx) {
    	let checkprofile;
    	let updating_checked;
    	let updating_userPw;
    	let current;

    	function checkprofile_checked_binding(value) {
    		/*checkprofile_checked_binding*/ ctx[4](value);
    	}

    	function checkprofile_userPw_binding(value) {
    		/*checkprofile_userPw_binding*/ ctx[5](value);
    	}

    	let checkprofile_props = {};

    	if (/*checked*/ ctx[1] !== void 0) {
    		checkprofile_props.checked = /*checked*/ ctx[1];
    	}

    	if (/*userPw*/ ctx[2] !== void 0) {
    		checkprofile_props.userPw = /*userPw*/ ctx[2];
    	}

    	checkprofile = new CheckProfile({
    			props: checkprofile_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(checkprofile, 'checked', checkprofile_checked_binding));
    	binding_callbacks.push(() => bind(checkprofile, 'userPw', checkprofile_userPw_binding));

    	const block = {
    		c: function create() {
    			create_component(checkprofile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(checkprofile, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const checkprofile_changes = {};

    			if (!updating_checked && dirty & /*checked*/ 2) {
    				updating_checked = true;
    				checkprofile_changes.checked = /*checked*/ ctx[1];
    				add_flush_callback(() => updating_checked = false);
    			}

    			if (!updating_userPw && dirty & /*userPw*/ 4) {
    				updating_userPw = true;
    				checkprofile_changes.userPw = /*userPw*/ ctx[2];
    				add_flush_callback(() => updating_userPw = false);
    			}

    			checkprofile.$set(checkprofile_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkprofile.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkprofile.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(checkprofile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(11:42) ",
    		ctx
    	});

    	return block;
    }

    // (9:0) {#if state === 'orders'}
    function create_if_block$2(ctx) {
    	let orders;
    	let updating_state;
    	let current;

    	function orders_state_binding(value) {
    		/*orders_state_binding*/ ctx[3](value);
    	}

    	let orders_props = { "}": true };

    	if (/*state*/ ctx[0] !== void 0) {
    		orders_props.state = /*state*/ ctx[0];
    	}

    	orders = new Orders({ props: orders_props, $$inline: true });
    	binding_callbacks.push(() => bind(orders, 'state', orders_state_binding));

    	const block = {
    		c: function create() {
    			create_component(orders.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(orders, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const orders_changes = {};

    			if (!updating_state && dirty & /*state*/ 1) {
    				updating_state = true;
    				orders_changes.state = /*state*/ ctx[0];
    				add_flush_callback(() => updating_state = false);
    			}

    			orders.$set(orders_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(orders.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(orders.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(orders, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(9:0) {#if state === 'orders'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*state*/ ctx[0] === 'orders') return 0;
    		if (/*state*/ ctx[0] === 'profile' && !/*checked*/ ctx[1]) return 1;
    		if (/*state*/ ctx[0] === 'profile' && /*checked*/ ctx[1]) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Mypage', slots, []);
    	let state = 'orders';
    	let checked = false;
    	let userPw;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Mypage> was created with unknown prop '${key}'`);
    	});

    	function orders_state_binding(value) {
    		state = value;
    		$$invalidate(0, state);
    	}

    	function checkprofile_checked_binding(value) {
    		checked = value;
    		$$invalidate(1, checked);
    	}

    	function checkprofile_userPw_binding(value) {
    		userPw = value;
    		$$invalidate(2, userPw);
    	}

    	function profile_state_binding(value) {
    		state = value;
    		$$invalidate(0, state);
    	}

    	function profile_userPw_binding(value) {
    		userPw = value;
    		$$invalidate(2, userPw);
    	}

    	$$self.$capture_state = () => ({
    		CheckProfile,
    		Profile,
    		Orders,
    		state,
    		checked,
    		userPw
    	});

    	$$self.$inject_state = $$props => {
    		if ('state' in $$props) $$invalidate(0, state = $$props.state);
    		if ('checked' in $$props) $$invalidate(1, checked = $$props.checked);
    		if ('userPw' in $$props) $$invalidate(2, userPw = $$props.userPw);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		state,
    		checked,
    		userPw,
    		orders_state_binding,
    		checkprofile_checked_binding,
    		checkprofile_userPw_binding,
    		profile_state_binding,
    		profile_userPw_binding
    	];
    }

    class Mypage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Mypage",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\routes\cart\Carts.svelte generated by Svelte v3.48.0 */
    const file$6 = "src\\routes\\cart\\Carts.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[19] = list;
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (168:16) {#if carts}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*carts*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*deleteCart, carts, totPriceWithComma, priceWithComma, subQuantity, addQuantity, cartChecked*/ 859) {
    				each_value = /*carts*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(168:16) {#if carts}",
    		ctx
    	});

    	return block;
    }

    // (169:20) {#each carts as cart, index}
    function create_each_block$1(ctx) {
    	let tr;
    	let td0;
    	let input;
    	let t0;
    	let td1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t1;
    	let td2;
    	let div2;
    	let div1;
    	let t2_value = /*cart*/ ctx[18].name + "";
    	let t2;
    	let t3;
    	let td3;
    	let div4;
    	let button0;
    	let t5;
    	let div3;
    	let t6_value = /*cart*/ ctx[18].quantity + "";
    	let t6;
    	let t7;
    	let button1;
    	let t9;
    	let td4;
    	let div5;
    	let t10_value = /*priceWithComma*/ ctx[4][/*index*/ ctx[20]] + "";
    	let t10;
    	let t11;
    	let td5;
    	let div6;
    	let t12_value = /*totPriceWithComma*/ ctx[3][/*index*/ ctx[20]] + "";
    	let t12;
    	let t13;
    	let td6;
    	let div7;
    	let svg;
    	let path;
    	let t14;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[11].call(input, /*index*/ ctx[20]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[12](/*cart*/ ctx[18]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[13](/*cart*/ ctx[18]);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[14](/*cart*/ ctx[18]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			input = element("input");
    			t0 = space();
    			td1 = element("td");
    			div0 = element("div");
    			img = element("img");
    			t1 = space();
    			td2 = element("td");
    			div2 = element("div");
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			td3 = element("td");
    			div4 = element("div");
    			button0 = element("button");
    			button0.textContent = "+";
    			t5 = space();
    			div3 = element("div");
    			t6 = text(t6_value);
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "-";
    			t9 = space();
    			td4 = element("td");
    			div5 = element("div");
    			t10 = text(t10_value);
    			t11 = space();
    			td5 = element("td");
    			div6 = element("div");
    			t12 = text(t12_value);
    			t13 = space();
    			td6 = element("td");
    			div7 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t14 = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "s-check svelte-n7ftrn");
    			add_location(input, file$6, 171, 33, 5460);
    			attr_dev(td0, "class", "svelte-n7ftrn");
    			add_location(td0, file$6, 170, 28, 5422);
    			if (!src_url_equal(img.src, img_src_value = /*cart*/ ctx[18].thumbnail)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*index*/ ctx[20].toString());
    			attr_dev(img, "height", "120px");
    			attr_dev(img, "class", "svelte-n7ftrn");
    			add_location(img, file$6, 179, 36, 5843);
    			attr_dev(div0, "class", "image-box svelte-n7ftrn");
    			add_location(div0, file$6, 178, 33, 5782);
    			attr_dev(td1, "class", "svelte-n7ftrn");
    			add_location(td1, file$6, 177, 28, 5744);
    			attr_dev(div1, "class", "goods_tit svelte-n7ftrn");
    			add_location(div1, file$6, 188, 36, 6268);
    			attr_dev(div2, "class", "info svelte-n7ftrn");
    			add_location(div2, file$6, 187, 32, 6212);
    			attr_dev(td2, "class", "svelte-n7ftrn");
    			add_location(td2, file$6, 186, 28, 6174);
    			attr_dev(button0, "class", "btn svelte-n7ftrn");
    			add_location(button0, file$6, 193, 36, 6527);
    			attr_dev(div3, "class", "count svelte-n7ftrn");
    			add_location(div3, file$6, 201, 36, 6963);
    			attr_dev(button1, "class", "btn svelte-n7ftrn");
    			add_location(button1, file$6, 202, 36, 7041);
    			attr_dev(div4, "class", "counter svelte-n7ftrn");
    			add_location(div4, file$6, 192, 32, 6468);
    			attr_dev(td3, "class", "quantity svelte-n7ftrn");
    			add_location(td3, file$6, 191, 28, 6413);
    			attr_dev(div5, "class", "price svelte-n7ftrn");
    			add_location(div5, file$6, 213, 32, 7582);
    			attr_dev(td4, "class", "svelte-n7ftrn");
    			add_location(td4, file$6, 212, 28, 7544);
    			attr_dev(div6, "class", "sum svelte-n7ftrn");
    			add_location(div6, file$6, 216, 32, 7733);
    			attr_dev(td5, "class", "svelte-n7ftrn");
    			add_location(td5, file$6, 215, 28, 7695);
    			attr_dev(path, "d", "M14.278 1.12l.722.72-6.278 6.28L15 14.397l-.722.722L8 8.841 1.722 15.12 1 14.397l6.278-6.278L1 1.841l.722-.722L8 7.397l6.278-6.278z");
    			attr_dev(path, "fill", "#BDC0C6");
    			attr_dev(path, "class", "svelte-n7ftrn");
    			add_location(path, file$6, 233, 40, 8615);
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "16");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			attr_dev(svg, "fill", "red");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "ico_delete--3rbOSkZl3A svelte-n7ftrn");
    			add_location(svg, file$6, 225, 36, 8164);
    			attr_dev(div7, "class", "delete svelte-n7ftrn");
    			add_location(div7, file$6, 221, 32, 7957);
    			attr_dev(td6, "class", "svelte-n7ftrn");
    			add_location(td6, file$6, 220, 28, 7919);
    			attr_dev(tr, "class", "svelte-n7ftrn");
    			add_location(tr, file$6, 169, 24, 5388);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, input);
    			input.checked = /*cartChecked*/ ctx[1][/*index*/ ctx[20]];
    			append_dev(tr, t0);
    			append_dev(tr, td1);
    			append_dev(td1, div0);
    			append_dev(div0, img);
    			append_dev(tr, t1);
    			append_dev(tr, td2);
    			append_dev(td2, div2);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td3);
    			append_dev(td3, div4);
    			append_dev(div4, button0);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, t6);
    			append_dev(div4, t7);
    			append_dev(div4, button1);
    			append_dev(tr, t9);
    			append_dev(tr, td4);
    			append_dev(td4, div5);
    			append_dev(div5, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td5);
    			append_dev(td5, div6);
    			append_dev(div6, t12);
    			append_dev(tr, t13);
    			append_dev(tr, td6);
    			append_dev(td6, div7);
    			append_dev(div7, svg);
    			append_dev(svg, path);
    			append_dev(tr, t14);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", input_change_handler),
    					listen_dev(button0, "click", click_handler, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false),
    					listen_dev(div7, "click", click_handler_2, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*cartChecked*/ 2) {
    				input.checked = /*cartChecked*/ ctx[1][/*index*/ ctx[20]];
    			}

    			if (dirty & /*carts*/ 1 && !src_url_equal(img.src, img_src_value = /*cart*/ ctx[18].thumbnail)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*carts*/ 1 && t2_value !== (t2_value = /*cart*/ ctx[18].name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*carts*/ 1 && t6_value !== (t6_value = /*cart*/ ctx[18].quantity + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*priceWithComma*/ 16 && t10_value !== (t10_value = /*priceWithComma*/ ctx[4][/*index*/ ctx[20]] + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*totPriceWithComma*/ 8 && t12_value !== (t12_value = /*totPriceWithComma*/ ctx[3][/*index*/ ctx[20]] + "")) set_data_dev(t12, t12_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(169:20) {#each carts as cart, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div8;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h1;
    	let t2;
    	let button0;
    	let t4;
    	let div6;
    	let div5;
    	let table;
    	let tr;
    	let th0;
    	let p0;
    	let t6;
    	let p1;
    	let t8;
    	let input;
    	let t9;
    	let th1;
    	let t11;
    	let th2;
    	let t13;
    	let th3;
    	let t15;
    	let th4;
    	let t17;
    	let th5;
    	let t19;
    	let th6;
    	let t21;
    	let t22;
    	let div3;
    	let t23;
    	let t24;
    	let t25;
    	let t26;
    	let div4;
    	let button1;
    	let t28;
    	let footer;
    	let div7;
    	let mounted;
    	let dispose;
    	let if_block = /*carts*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "장바구니";
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "선택삭제❌";
    			t4 = space();
    			div6 = element("div");
    			div5 = element("div");
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			p0 = element("p");
    			p0.textContent = "전체";
    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "선택";
    			t8 = space();
    			input = element("input");
    			t9 = space();
    			th1 = element("th");
    			th1.textContent = "이미지";
    			t11 = space();
    			th2 = element("th");
    			th2.textContent = "상품정보";
    			t13 = space();
    			th3 = element("th");
    			th3.textContent = "수량";
    			t15 = space();
    			th4 = element("th");
    			th4.textContent = "상품금액";
    			t17 = space();
    			th5 = element("th");
    			th5.textContent = "합계";
    			t19 = space();
    			th6 = element("th");
    			th6.textContent = "취소버튼";
    			t21 = space();
    			if (if_block) if_block.c();
    			t22 = space();
    			div3 = element("div");
    			t23 = text("총 주문금액 : ");
    			t24 = text(/*totPriceSum*/ ctx[2]);
    			t25 = text("원");
    			t26 = space();
    			div4 = element("div");
    			button1 = element("button");
    			button1.textContent = "결제하기";
    			t28 = space();
    			footer = element("footer");
    			div7 = element("div");
    			if (!src_url_equal(img.src, img_src_value = "images/logo/logosmall2.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "width", "240");
    			attr_dev(img, "height", "100");
    			attr_dev(img, "class", "svelte-n7ftrn");
    			add_location(img, file$6, 137, 12, 4440);
    			attr_dev(div0, "class", "logo svelte-n7ftrn");
    			add_location(div0, file$6, 136, 8, 4408);
    			attr_dev(h1, "class", "svelte-n7ftrn");
    			add_location(h1, file$6, 144, 30, 4645);
    			attr_dev(div1, "class", "tit_page svelte-n7ftrn");
    			add_location(div1, file$6, 144, 8, 4623);
    			attr_dev(button0, "class", "deselect svelte-n7ftrn");
    			add_location(button0, file$6, 145, 8, 4674);
    			attr_dev(div2, "class", "cart-header svelte-n7ftrn");
    			add_location(div2, file$6, 135, 4, 4373);
    			attr_dev(p0, "class", "svelte-n7ftrn");
    			add_location(p0, file$6, 155, 25, 4931);
    			attr_dev(p1, "class", "svelte-n7ftrn");
    			add_location(p1, file$6, 156, 24, 4966);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "svelte-n7ftrn");
    			add_location(input, file$6, 157, 24, 5001);
    			attr_dev(th0, "class", "svelte-n7ftrn");
    			add_location(th0, file$6, 154, 20, 4901);
    			attr_dev(th1, "class", "svelte-n7ftrn");
    			add_location(th1, file$6, 160, 20, 5077);
    			attr_dev(th2, "class", "svelte-n7ftrn");
    			add_location(th2, file$6, 161, 20, 5111);
    			attr_dev(th3, "class", "svelte-n7ftrn");
    			add_location(th3, file$6, 162, 20, 5146);
    			attr_dev(th4, "class", "svelte-n7ftrn");
    			add_location(th4, file$6, 163, 20, 5179);
    			attr_dev(th5, "class", "svelte-n7ftrn");
    			add_location(th5, file$6, 164, 20, 5214);
    			attr_dev(th6, "class", "svelte-n7ftrn");
    			add_location(th6, file$6, 165, 20, 5247);
    			attr_dev(tr, "class", "svelte-n7ftrn");
    			add_location(tr, file$6, 153, 16, 4875);
    			attr_dev(table, "class", "svelte-n7ftrn");
    			add_location(table, file$6, 152, 12, 4850);
    			attr_dev(div3, "class", "total_price svelte-n7ftrn");
    			add_location(div3, file$6, 245, 12, 9145);
    			attr_dev(button1, "class", "check-out svelte-n7ftrn");
    			add_location(button1, file$6, 247, 16, 9236);
    			attr_dev(div4, "class", "svelte-n7ftrn");
    			add_location(div4, file$6, 246, 12, 9213);
    			attr_dev(div5, "class", "content svelte-n7ftrn");
    			add_location(div5, file$6, 151, 8, 4815);
    			attr_dev(div6, "class", "main svelte-n7ftrn");
    			add_location(div6, file$6, 150, 4, 4787);
    			attr_dev(div7, "class", " svelte-n7ftrn");
    			add_location(div7, file$6, 255, 8, 9414);
    			attr_dev(footer, "class", "svelte-n7ftrn");
    			add_location(footer, file$6, 254, 4, 9396);
    			attr_dev(div8, "class", "cart-container svelte-n7ftrn");
    			add_location(div8, file$6, 134, 0, 4339);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(div2, t2);
    			append_dev(div2, button0);
    			append_dev(div8, t4);
    			append_dev(div8, div6);
    			append_dev(div6, div5);
    			append_dev(div5, table);
    			append_dev(table, tr);
    			append_dev(tr, th0);
    			append_dev(th0, p0);
    			append_dev(th0, t6);
    			append_dev(th0, p1);
    			append_dev(th0, t8);
    			append_dev(th0, input);
    			append_dev(tr, t9);
    			append_dev(tr, th1);
    			append_dev(tr, t11);
    			append_dev(tr, th2);
    			append_dev(tr, t13);
    			append_dev(tr, th3);
    			append_dev(tr, t15);
    			append_dev(tr, th4);
    			append_dev(tr, t17);
    			append_dev(tr, th5);
    			append_dev(tr, t19);
    			append_dev(tr, th6);
    			append_dev(table, t21);
    			if (if_block) if_block.m(table, null);
    			append_dev(div5, t22);
    			append_dev(div5, div3);
    			append_dev(div3, t23);
    			append_dev(div3, t24);
    			append_dev(div3, t25);
    			append_dev(div5, t26);
    			append_dev(div5, div4);
    			append_dev(div4, button1);
    			append_dev(div8, t28);
    			append_dev(div8, footer);
    			append_dev(footer, div7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*deleteSelectedCart*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*click_handler_3*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*carts*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(table, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*totPriceSum*/ 4) set_data_dev(t24, /*totPriceSum*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let priceWithComma;
    	let totPrice;
    	let totPriceWithComma;
    	let totPriceSum;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Carts', slots, []);

    	const refreshCart = async () => {
    		let userId = localStorage.getItem('userId');
    		let token = localStorage.getItem('token');

    		if (userId && token) {
    			const res = await fetch(`${URL$1}/api/v1/user/${userId}/cart`, {
    				method: 'GET',
    				headers: {
    					'Content-Type': 'application/json',
    					Authorization: token
    				}
    			});

    			if (res.status === 200) {
    				$$invalidate(0, carts = await res.json());
    			} else if (res.status === 401) {
    				alert('로그인 후 이용 가능합니다.');
    				pop();
    			}
    		} else {
    			pop();
    			alert('로그인 후 이용 가능합니다.');
    		}
    	};

    	let carts;
    	let cartChecked = [];

    	onMount(async () => {
    		refreshCart();
    	});

    	const order = async () => {
    		const cartIdList = carts === null || carts === void 0
    		? void 0
    		: carts.filter((cart, index) => cartChecked[index]).map(cart => cart.cartId);

    		const userId = localStorage.getItem('userId');
    		const token = localStorage.getItem('token');

    		if (userId && token) {
    			const res = await fetch(`${URL$1}/api/v1/user/${userId}/order`, {
    				method: 'POST',
    				headers: {
    					'Content-Type': 'application/json',
    					Authorization: token
    				},
    				body: JSON.stringify({ cartIdList })
    			});

    			if (res.status === 200) {
    				alert('주문이 완료되었습니다.');
    				pop();
    			} else if (res.status === 401) {
    				alert('로그인 후 이용 가능합니다.');
    				localStorage.clear();
    				pop();
    			} else if (res.status === 400) {
    				alert('주문에 실패했습니다.');
    				pop();
    			}
    		}
    	};

    	const deleteCart = async cartId => {
    		let userId = localStorage.getItem('userId');
    		let token = localStorage.getItem('token');

    		const res = await fetch(`${URL$1}/api/v1/user/${userId}/cart/${cartId}`, {
    			method: 'DELETE',
    			headers: {
    				'Content-Type': 'application/json',
    				Authorization: token
    			}
    		});

    		if (res.status === 200) {
    			refreshCart();
    		} else if (res.status === 401) {
    			alert('로그인 후 이용 가능힙나디.');
    			pop();
    		} else {
    			alert('장바구니 삭제에 실패했습니다.');
    		}
    	};

    	const deleteSelectedCart = async () => {
    		carts.forEach(async (cart, index) => {
    			if (cartChecked[index]) {
    				deleteCart(cart.cartId);
    			}
    		});
    	};

    	const updateQuantity = async (cartId, quantity) => {
    		let userId = localStorage.getItem('userId');
    		let token = localStorage.getItem('token');

    		const res = await fetch(`${URL$1}/api/v1/user/${userId}/cart/${cartId}`, {
    			method: 'PUT',
    			headers: {
    				'Content-Type': 'application/json',
    				Authorization: token
    			},
    			body: JSON.stringify({ quantity })
    		});

    		if (res.status === 200) {
    			refreshCart();
    		}
    	};

    	const addQuantity = async (cartId, quantity) => {
    		updateQuantity(cartId, quantity + 1);
    	};

    	const subQuantity = async (cartId, quantity) => {
    		if (quantity > 1) {
    			updateQuantity(cartId, quantity - 1);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Carts> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler(index) {
    		cartChecked[index] = this.checked;
    		$$invalidate(1, cartChecked);
    	}

    	const click_handler = cart => addQuantity(cart.cartId, cart.quantity);
    	const click_handler_1 = cart => subQuantity(cart.cartId, cart.quantity);
    	const click_handler_2 = cart => deleteCart(cart.cartId);
    	const click_handler_3 = () => order();

    	$$self.$capture_state = () => ({
    		onMount,
    		pop,
    		URL: URL$1,
    		refreshCart,
    		carts,
    		cartChecked,
    		order,
    		deleteCart,
    		deleteSelectedCart,
    		updateQuantity,
    		addQuantity,
    		subQuantity,
    		totPrice,
    		totPriceSum,
    		totPriceWithComma,
    		priceWithComma
    	});

    	$$self.$inject_state = $$props => {
    		if ('carts' in $$props) $$invalidate(0, carts = $$props.carts);
    		if ('cartChecked' in $$props) $$invalidate(1, cartChecked = $$props.cartChecked);
    		if ('totPrice' in $$props) $$invalidate(10, totPrice = $$props.totPrice);
    		if ('totPriceSum' in $$props) $$invalidate(2, totPriceSum = $$props.totPriceSum);
    		if ('totPriceWithComma' in $$props) $$invalidate(3, totPriceWithComma = $$props.totPriceWithComma);
    		if ('priceWithComma' in $$props) $$invalidate(4, priceWithComma = $$props.priceWithComma);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*carts*/ 1) {
    			$$invalidate(4, priceWithComma = carts === null || carts === void 0
    			? void 0
    			: carts.map(cart => {
    					var _a, _b;

    					return (_b = (_a = cart.price) === null || _a === void 0
    					? void 0
    					: _a.toString()) === null || _b === void 0
    					? void 0
    					: _b.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
    				}));
    		}

    		if ($$self.$$.dirty & /*carts*/ 1) {
    			$$invalidate(10, totPrice = carts === null || carts === void 0
    			? void 0
    			: carts.map(cart => cart.price * cart.quantity));
    		}

    		if ($$self.$$.dirty & /*totPrice*/ 1024) {
    			$$invalidate(3, totPriceWithComma = totPrice === null || totPrice === void 0
    			? void 0
    			: totPrice.map(totPrice => {
    					var _a;

    					return (_a = totPrice === null || totPrice === void 0
    					? void 0
    					: totPrice.toString()) === null || _a === void 0
    					? void 0
    					: _a.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
    				}));
    		}

    		if ($$self.$$.dirty & /*totPrice, cartChecked*/ 1026) {
    			$$invalidate(2, totPriceSum = totPrice === null || totPrice === void 0
    			? void 0
    			: totPrice.reduce(
    					(acc, p, index) => {
    						if (cartChecked[index]) {
    							return acc + p;
    						}

    						return acc;
    					},
    					0
    				));
    		}
    	};

    	return [
    		carts,
    		cartChecked,
    		totPriceSum,
    		totPriceWithComma,
    		priceWithComma,
    		order,
    		deleteCart,
    		deleteSelectedCart,
    		addQuantity,
    		subQuantity,
    		totPrice,
    		input_change_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Carts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Carts",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\routes\seller\Login.svelte generated by Svelte v3.48.0 */
    const file$5 = "src\\routes\\seller\\Login.svelte";

    function create_fragment$6(ctx) {
    	let div9;
    	let div7;
    	let header;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let section;
    	let div2;
    	let div1;
    	let i0;
    	let t1;
    	let input0;
    	let t2;
    	let div4;
    	let div3;
    	let i1;
    	let t3;
    	let input1;
    	let t4;
    	let div5;
    	let button0;
    	let t6;
    	let p;
    	let t7;
    	let div6;
    	let button1;
    	let t9;
    	let footer;
    	let div8;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div7 = element("div");
    			header = element("header");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			section = element("section");
    			div2 = element("div");
    			div1 = element("div");
    			i0 = element("i");
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div4 = element("div");
    			div3 = element("div");
    			i1 = element("i");
    			t3 = space();
    			input1 = element("input");
    			t4 = space();
    			div5 = element("div");
    			button0 = element("button");
    			button0.textContent = "로그인";
    			t6 = space();
    			p = element("p");
    			t7 = space();
    			div6 = element("div");
    			button1 = element("button");
    			button1.textContent = "회원가입";
    			t9 = space();
    			footer = element("footer");
    			div8 = element("div");
    			span = element("span");
    			span.textContent = "Copyright © My shop Corp. All Rights Reserved.";
    			if (!src_url_equal(img.src, img_src_value = "images/logo/logosmall2.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "300");
    			attr_dev(img, "height", "120");
    			add_location(img, file$5, 37, 16, 1173);
    			attr_dev(div0, "class", "member-logo svelte-z3pfg3");
    			add_location(div0, file$5, 36, 12, 1130);
    			attr_dev(header, "class", "member-header");
    			add_location(header, file$5, 35, 8, 1086);
    			attr_dev(i0, "class", "fa fa-user");
    			add_location(i0, file$5, 48, 20, 1568);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "ID");
    			attr_dev(input0, "id", "id");
    			attr_dev(input0, "class", "account svelte-z3pfg3");
    			add_location(input0, file$5, 49, 20, 1614);
    			attr_dev(div1, "class", "id_icon svelte-z3pfg3");
    			add_location(div1, file$5, 47, 16, 1525);
    			attr_dev(div2, "class", "login-input-wrap svelte-z3pfg3");
    			add_location(div2, file$5, 46, 12, 1477);
    			attr_dev(i1, "class", "fa fa-lock");
    			add_location(i1, file$5, 60, 20, 2007);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "placeholder", "Password");
    			attr_dev(input1, "id", "password");
    			attr_dev(input1, "class", "account svelte-z3pfg3");
    			add_location(input1, file$5, 61, 20, 2053);
    			attr_dev(div3, "class", "pw_icon svelte-z3pfg3");
    			add_location(div3, file$5, 59, 16, 1964);
    			attr_dev(div4, "class", "login-input-wrap password-wrap svelte-z3pfg3");
    			add_location(div4, file$5, 58, 12, 1902);
    			attr_dev(button0, "id", "login");
    			attr_dev(button0, "class", "account svelte-z3pfg3");
    			add_location(button0, file$5, 71, 16, 2406);
    			attr_dev(p, "id", "alert");
    			attr_dev(p, "class", "account");
    			add_location(p, file$5, 74, 16, 2528);
    			attr_dev(div5, "class", "login-button-wrap svelte-z3pfg3");
    			add_location(div5, file$5, 70, 12, 2357);
    			attr_dev(button1, "class", "svelte-z3pfg3");
    			add_location(button1, file$5, 77, 16, 2638);
    			attr_dev(div6, "class", "sign-in-wrap svelte-z3pfg3");
    			add_location(div6, file$5, 76, 12, 2594);
    			attr_dev(section, "class", "login-input-section-wrap svelte-z3pfg3");
    			add_location(section, file$5, 45, 8, 1421);
    			attr_dev(div7, "class", "wrapper svelte-z3pfg3");
    			add_location(div7, file$5, 34, 4, 1055);
    			add_location(span, file$5, 83, 12, 2810);
    			attr_dev(div8, "class", "copyright-wrap svelte-z3pfg3");
    			add_location(div8, file$5, 82, 8, 2768);
    			attr_dev(footer, "class", "svelte-z3pfg3");
    			add_location(footer, file$5, 81, 4, 2750);
    			attr_dev(div9, "class", "member_container svelte-z3pfg3");
    			add_location(div9, file$5, 33, 0, 1019);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div7);
    			append_dev(div7, header);
    			append_dev(header, div0);
    			append_dev(div0, img);
    			append_dev(div7, t0);
    			append_dev(div7, section);
    			append_dev(section, div2);
    			append_dev(div2, div1);
    			append_dev(div1, i0);
    			append_dev(div1, t1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*sellerId*/ ctx[0]);
    			append_dev(section, t2);
    			append_dev(section, div4);
    			append_dev(div4, div3);
    			append_dev(div3, i1);
    			append_dev(div3, t3);
    			append_dev(div3, input1);
    			set_input_value(input1, /*sellerPw*/ ctx[1]);
    			append_dev(section, t4);
    			append_dev(section, div5);
    			append_dev(div5, button0);
    			append_dev(div5, t6);
    			append_dev(div5, p);
    			append_dev(section, t7);
    			append_dev(section, div6);
    			append_dev(div6, button1);
    			append_dev(div9, t9);
    			append_dev(div9, footer);
    			append_dev(footer, div8);
    			append_dev(div8, span);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(button0, "click", /*login*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sellerId*/ 1 && input0.value !== /*sellerId*/ ctx[0]) {
    				set_input_value(input0, /*sellerId*/ ctx[0]);
    			}

    			if (dirty & /*sellerPw*/ 2 && input1.value !== /*sellerPw*/ ctx[1]) {
    				set_input_value(input1, /*sellerPw*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	let sellerId;
    	let sellerPw;

    	const login = async () => {
    		const res = await fetch(`${URL}/api/v1/seller/login`, {
    			method: 'POST',
    			headers: { 'Content-Type': 'application/json' },
    			body: JSON.stringify({
    				sellerId,
    				sellerPw,
    				name: '',
    				email: '',
    				phonenumber: ''
    			})
    		});

    		K(res).with({ status: 200 }, () => {
    			const token = res.headers.get('Authorization');
    			localStorage.setItem('token', token);
    			localStorage.setItem('sellerId', sellerId);
    			push('/seller');
    		}).with({ status: 400 }, () => alert('올바르지 않은 요청입니다.')).with({ status: 401 }, () => alert('비밀번호가 일치하지 않습니다.')).with({ status: 404 }, () => alert('존재하지 않는 계정입니다.')).exhaustive();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => push('/seller');

    	function input0_input_handler() {
    		sellerId = this.value;
    		$$invalidate(0, sellerId);
    	}

    	function input1_input_handler() {
    		sellerPw = this.value;
    		$$invalidate(1, sellerPw);
    	}

    	const click_handler_1 = () => push('/regist');

    	$$self.$capture_state = () => ({
    		push,
    		match: K,
    		URL,
    		sellerId,
    		sellerPw,
    		login
    	});

    	$$self.$inject_state = $$props => {
    		if ('sellerId' in $$props) $$invalidate(0, sellerId = $$props.sellerId);
    		if ('sellerPw' in $$props) $$invalidate(1, sellerPw = $$props.sellerPw);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		sellerId,
    		sellerPw,
    		login,
    		click_handler,
    		input0_input_handler,
    		input1_input_handler,
    		click_handler_1
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\routes\seller\Regist.svelte generated by Svelte v3.48.0 */
    const file$4 = "src\\routes\\seller\\Regist.svelte";

    function create_fragment$5(ctx) {
    	let div0;
    	let h1;
    	let t1;
    	let a;
    	let img;
    	let img_src_value;
    	let t2;
    	let div8;
    	let div7;
    	let div1;
    	let h30;
    	let label0;
    	let t4;
    	let span1;
    	let input0;
    	let t5;
    	let span0;
    	let t6;
    	let span2;
    	let t7;
    	let div2;
    	let h31;
    	let label1;
    	let t9;
    	let span3;
    	let input1;
    	let t10;
    	let span4;
    	let t11;
    	let div3;
    	let h32;
    	let label2;
    	let t13;
    	let span5;
    	let input2;
    	let t14;
    	let span6;
    	let t15;
    	let div4;
    	let h33;
    	let label3;
    	let t17;
    	let span7;
    	let input3;
    	let t18;
    	let span8;
    	let t20;
    	let div5;
    	let h34;
    	let label4;
    	let t22;
    	let span9;
    	let input4;
    	let t23;
    	let span10;
    	let t24;
    	let div6;
    	let button;
    	let span11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "판매자 회원가입 페이지";
    			t1 = space();
    			a = element("a");
    			img = element("img");
    			t2 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div1 = element("div");
    			h30 = element("h3");
    			label0 = element("label");
    			label0.textContent = "아이디";
    			t4 = space();
    			span1 = element("span");
    			input0 = element("input");
    			t5 = space();
    			span0 = element("span");
    			t6 = space();
    			span2 = element("span");
    			t7 = space();
    			div2 = element("div");
    			h31 = element("h3");
    			label1 = element("label");
    			label1.textContent = "비밀번호";
    			t9 = space();
    			span3 = element("span");
    			input1 = element("input");
    			t10 = space();
    			span4 = element("span");
    			t11 = space();
    			div3 = element("div");
    			h32 = element("h3");
    			label2 = element("label");
    			label2.textContent = "이름";
    			t13 = space();
    			span5 = element("span");
    			input2 = element("input");
    			t14 = space();
    			span6 = element("span");
    			t15 = space();
    			div4 = element("div");
    			h33 = element("h3");
    			label3 = element("label");
    			label3.textContent = "이메일";
    			t17 = space();
    			span7 = element("span");
    			input3 = element("input");
    			t18 = space();
    			span8 = element("span");
    			span8.textContent = "이메일 주소를 다시 확인해주세요.";
    			t20 = space();
    			div5 = element("div");
    			h34 = element("h3");
    			label4 = element("label");
    			label4.textContent = "휴대전화";
    			t22 = space();
    			span9 = element("span");
    			input4 = element("input");
    			t23 = space();
    			span10 = element("span");
    			t24 = space();
    			div6 = element("div");
    			button = element("button");
    			span11 = element("span");
    			span11.textContent = "가입하기";
    			attr_dev(h1, "class", "signup_title");
    			add_location(h1, file$4, 139, 4, 3966);
    			if (!src_url_equal(img.src, img_src_value = "images/logo/logo_cut.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "id", "logo");
    			attr_dev(img, "class", "svelte-1c1ehfy");
    			add_location(img, file$4, 141, 9, 4076);
    			attr_dev(a, "href", "/seller");
    			attr_dev(a, "title", "Myshop 홈페이지 바로가기");
    			add_location(a, file$4, 140, 4, 4014);
    			attr_dev(div0, "id", "header");
    			attr_dev(div0, "class", "svelte-1c1ehfy");
    			add_location(div0, file$4, 138, 0, 3943);
    			attr_dev(label0, "for", "id");
    			add_location(label0, file$4, 152, 16, 4318);
    			attr_dev(h30, "class", "join_title svelte-1c1ehfy");
    			add_location(h30, file$4, 151, 12, 4277);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "id");
    			attr_dev(input0, "class", "int svelte-1c1ehfy");
    			attr_dev(input0, "maxlength", "20");
    			attr_dev(input0, "placeholder", "아이디를 입력하세요.");
    			add_location(input0, file$4, 155, 16, 4421);
    			attr_dev(span0, "class", "");
    			add_location(span0, file$4, 163, 16, 4686);
    			attr_dev(span1, "class", "box int_id svelte-1c1ehfy");
    			add_location(span1, file$4, 154, 12, 4378);
    			attr_dev(span2, "class", "error_next_box svelte-1c1ehfy");
    			add_location(span2, file$4, 165, 12, 4738);
    			add_location(div1, file$4, 150, 8, 4258);
    			attr_dev(label1, "for", "pw1");
    			add_location(label1, file$4, 170, 35, 4882);
    			attr_dev(h31, "class", "join_title svelte-1c1ehfy");
    			add_location(h31, file$4, 170, 12, 4859);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "pw1");
    			attr_dev(input1, "class", "int svelte-1c1ehfy");
    			attr_dev(input1, "maxlength", "20");
    			attr_dev(input1, "placeholder", "******");
    			add_location(input1, file$4, 172, 16, 4975);
    			attr_dev(span3, "class", "box int_pass svelte-1c1ehfy");
    			add_location(span3, file$4, 171, 12, 4930);
    			attr_dev(span4, "class", "error_next_box svelte-1c1ehfy");
    			add_location(span4, file$4, 181, 12, 5257);
    			add_location(div2, file$4, 169, 8, 4840);
    			attr_dev(label2, "for", "name");
    			add_location(label2, file$4, 186, 35, 5402);
    			attr_dev(h32, "class", "join_title svelte-1c1ehfy");
    			add_location(h32, file$4, 186, 12, 5379);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "id", "name");
    			attr_dev(input2, "class", "int svelte-1c1ehfy");
    			attr_dev(input2, "maxlength", "20");
    			attr_dev(input2, "placeholder", "이름을 입력하세요.");
    			add_location(input2, file$4, 188, 16, 5494);
    			attr_dev(span5, "class", "box int_name svelte-1c1ehfy");
    			add_location(span5, file$4, 187, 12, 5449);
    			attr_dev(span6, "class", "error_next_box svelte-1c1ehfy");
    			add_location(span6, file$4, 197, 12, 5773);
    			add_location(div3, file$4, 185, 8, 5360);
    			attr_dev(label3, "for", "email");
    			add_location(label3, file$4, 203, 16, 5937);
    			attr_dev(h33, "class", "join_title svelte-1c1ehfy");
    			add_location(h33, file$4, 202, 12, 5896);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "id", "email");
    			attr_dev(input3, "class", "int svelte-1c1ehfy");
    			attr_dev(input3, "maxlength", "100");
    			attr_dev(input3, "placeholder", "example@gmail.com");
    			add_location(input3, file$4, 206, 16, 6046);
    			attr_dev(span7, "class", "box int_email svelte-1c1ehfy");
    			add_location(span7, file$4, 205, 12, 6000);
    			attr_dev(span8, "class", "error_next_box svelte-1c1ehfy");
    			add_location(span8, file$4, 215, 12, 6335);
    			add_location(div4, file$4, 201, 8, 5877);
    			attr_dev(label4, "for", "phoneNo");
    			add_location(label4, file$4, 222, 35, 6537);
    			attr_dev(h34, "class", "join_title svelte-1c1ehfy");
    			add_location(h34, file$4, 222, 12, 6514);
    			attr_dev(input4, "type", "tel");
    			attr_dev(input4, "id", "mobile");
    			attr_dev(input4, "class", "int svelte-1c1ehfy");
    			attr_dev(input4, "maxlength", "16");
    			attr_dev(input4, "placeholder", "010-XXXX-XXXX");
    			add_location(input4, file$4, 224, 16, 6636);
    			attr_dev(span9, "class", "box int_mobile svelte-1c1ehfy");
    			add_location(span9, file$4, 223, 12, 6589);
    			attr_dev(span10, "class", "error_next_box svelte-1c1ehfy");
    			add_location(span10, file$4, 233, 12, 6926);
    			add_location(div5, file$4, 221, 8, 6495);
    			add_location(span11, file$4, 239, 16, 7139);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "id", "btnJoin");
    			attr_dev(button, "class", "svelte-1c1ehfy");
    			add_location(button, file$4, 238, 12, 7068);
    			attr_dev(div6, "class", "btn_area svelte-1c1ehfy");
    			add_location(div6, file$4, 237, 8, 7032);
    			attr_dev(div7, "id", "content");
    			attr_dev(div7, "class", "svelte-1c1ehfy");
    			add_location(div7, file$4, 148, 4, 4209);
    			attr_dev(div8, "id", "wrapper");
    			attr_dev(div8, "class", "svelte-1c1ehfy");
    			add_location(div8, file$4, 146, 0, 4164);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, a);
    			append_dev(a, img);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, div1);
    			append_dev(div1, h30);
    			append_dev(h30, label0);
    			append_dev(div1, t4);
    			append_dev(div1, span1);
    			append_dev(span1, input0);
    			set_input_value(input0, /*sellerId*/ ctx[0]);
    			append_dev(span1, t5);
    			append_dev(span1, span0);
    			append_dev(div1, t6);
    			append_dev(div1, span2);
    			/*span2_binding*/ ctx[8](span2);
    			append_dev(div7, t7);
    			append_dev(div7, div2);
    			append_dev(div2, h31);
    			append_dev(h31, label1);
    			append_dev(div2, t9);
    			append_dev(div2, span3);
    			append_dev(span3, input1);
    			set_input_value(input1, /*sellerPw*/ ctx[1]);
    			append_dev(div2, t10);
    			append_dev(div2, span4);
    			/*span4_binding*/ ctx[10](span4);
    			append_dev(div7, t11);
    			append_dev(div7, div3);
    			append_dev(div3, h32);
    			append_dev(h32, label2);
    			append_dev(div3, t13);
    			append_dev(div3, span5);
    			append_dev(span5, input2);
    			set_input_value(input2, /*name*/ ctx[2]);
    			append_dev(div3, t14);
    			append_dev(div3, span6);
    			/*span6_binding*/ ctx[12](span6);
    			append_dev(div7, t15);
    			append_dev(div7, div4);
    			append_dev(div4, h33);
    			append_dev(h33, label3);
    			append_dev(div4, t17);
    			append_dev(div4, span7);
    			append_dev(span7, input3);
    			set_input_value(input3, /*email*/ ctx[3]);
    			append_dev(div4, t18);
    			append_dev(div4, span8);
    			/*span8_binding*/ ctx[14](span8);
    			append_dev(div7, t20);
    			append_dev(div7, div5);
    			append_dev(div5, h34);
    			append_dev(h34, label4);
    			append_dev(div5, t22);
    			append_dev(div5, span9);
    			append_dev(span9, input4);
    			set_input_value(input4, /*phonenumber*/ ctx[4]);
    			append_dev(div5, t23);
    			append_dev(div5, span10);
    			/*span10_binding*/ ctx[16](span10);
    			append_dev(div7, t24);
    			append_dev(div7, div6);
    			append_dev(div6, button);
    			append_dev(button, span11);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a)),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[11]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[13]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[15]),
    					listen_dev(button, "click", /*regist*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sellerId*/ 1 && input0.value !== /*sellerId*/ ctx[0]) {
    				set_input_value(input0, /*sellerId*/ ctx[0]);
    			}

    			if (dirty & /*sellerPw*/ 2 && input1.value !== /*sellerPw*/ ctx[1]) {
    				set_input_value(input1, /*sellerPw*/ ctx[1]);
    			}

    			if (dirty & /*name*/ 4 && input2.value !== /*name*/ ctx[2]) {
    				set_input_value(input2, /*name*/ ctx[2]);
    			}

    			if (dirty & /*email*/ 8 && input3.value !== /*email*/ ctx[3]) {
    				set_input_value(input3, /*email*/ ctx[3]);
    			}

    			if (dirty & /*phonenumber*/ 16) {
    				set_input_value(input4, /*phonenumber*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div8);
    			/*span2_binding*/ ctx[8](null);
    			/*span4_binding*/ ctx[10](null);
    			/*span6_binding*/ ctx[12](null);
    			/*span8_binding*/ ctx[14](null);
    			/*span10_binding*/ ctx[16](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Regist', slots, []);
    	let sellerId;
    	let sellerPw;
    	let name;
    	let email;
    	let phonenumber;
    	let error = [];

    	function checkId(sellerId) {
    		const idPattern = /^[a-z]+[a-z0-9]{5,19}$/;

    		if (sellerId === undefined || sellerId === '') {
    			$$invalidate(5, error[0].innerHTML = '필수 정보입니다.', error);
    			$$invalidate(5, error[0].style.display = 'block', error);
    			return false;
    		} else if (!idPattern.test(sellerId)) {
    			$$invalidate(5, error[0].innerHTML = '5~19자의 영문 소문자, 숫자만 사용 가능합니다.', error);
    			$$invalidate(5, error[0].style.display = 'block', error);
    			return false;
    		} else {
    			$$invalidate(5, error[0].style.display = 'none', error);
    			return true;
    		}
    	}

    	function checkPw(sellerPw) {
    		let pwPattern = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/;

    		if (sellerPw === undefined || sellerPw === '') {
    			$$invalidate(5, error[1].innerHTML = '필수 정보입니다.', error);
    			$$invalidate(5, error[1].style.display = 'block', error);
    			return false;
    		} else if (!pwPattern.test(sellerPw)) {
    			$$invalidate(5, error[1].innerHTML = '8~16자의 영문 및 숫자를 사용해 주세요.', error);
    			$$invalidate(5, error[1].style.display = 'block', error);
    			return false;
    		} else {
    			$$invalidate(5, error[1].style.display = 'none', error);
    			return true;
    		}
    	}

    	function checkName(name) {
    		var namePattern = /[가-힣]/;

    		if (name === undefined || name === '') {
    			$$invalidate(5, error[2].innerHTML = '필수 정보입니다.', error);
    			$$invalidate(5, error[2].style.display = 'block', error);
    			return false;
    		} else if (!namePattern.test(name)) {
    			$$invalidate(5, error[2].innerHTML = '한글만 입력 가능합니다.', error);
    			$$invalidate(5, error[2].style.display = 'block', error);
    			return false;
    		} else {
    			$$invalidate(5, error[2].style.display = 'none', error);
    			return true;
    		}
    	}

    	function isEmailCorrect(email) {
    		var emailPattern = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/;

    		if (email === '') {
    			$$invalidate(5, error[3].style.display = 'none', error);
    			return false;
    		} else if (!emailPattern.test(email)) {
    			$$invalidate(5, error[3].style.display = 'block', error);
    			return false;
    		} else {
    			$$invalidate(5, error[3].style.display = 'none', error);
    			return true;
    		}
    	}

    	function checkPhoneNum(phone) {
    		var isPhoneNum = /\d{3}-\d{3,4}-\d{4}$/;

    		if (phone === '') {
    			$$invalidate(5, error[4].innerHTML = '필수 정보입니다.', error);
    			$$invalidate(5, error[4].style.display = 'block', error);
    			return false;
    		} else if (!isPhoneNum.test(phone)) {
    			$$invalidate(5, error[4].innerHTML = '형식에 맞지 않는 번호입니다.', error);
    			$$invalidate(5, error[4].style.display = 'block', error);
    			return false;
    		} else {
    			$$invalidate(5, error[4].style.display = 'none', error);
    			return true;
    		}
    	}

    	const regist = async () => {
    		const validation = {
    			sellerId: checkId(sellerId),
    			sellerPw: checkPw(sellerPw),
    			name: checkName(name),
    			email: isEmailCorrect(email),
    			phone: checkPhoneNum(phonenumber)
    		};

    		if (validation.sellerId && validation.sellerPw && validation.name && validation.email && validation.phone) {
    			const res = await fetch(`${URL$1}/api/v1/seller`, {
    				method: 'POST',
    				headers: { 'Content-Type': 'application/json' },
    				body: JSON.stringify({
    					sellerId,
    					sellerPw,
    					name,
    					email,
    					phonenumber
    				})
    			});

    			K(res).with({ status: 201 }, () => {
    				alert('회원가입이 완료되었습니다.');
    				push('/seller');
    			}).with({ status: 422 }, async () => {
    				const jsonBody = await res.json();
    				alert(jsonBody.error);
    			}).with({ status: 400 }, async () => {
    				const jsonBody = await res.json();
    				alert(jsonBody.error);
    			}).run;
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Regist> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		sellerId = this.value;
    		$$invalidate(0, sellerId);
    	}

    	function span2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			error[0] = $$value;
    			$$invalidate(5, error);
    		});
    	}

    	function input1_input_handler() {
    		sellerPw = this.value;
    		$$invalidate(1, sellerPw);
    	}

    	function span4_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			error[1] = $$value;
    			$$invalidate(5, error);
    		});
    	}

    	function input2_input_handler() {
    		name = this.value;
    		$$invalidate(2, name);
    	}

    	function span6_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			error[2] = $$value;
    			$$invalidate(5, error);
    		});
    	}

    	function input3_input_handler() {
    		email = this.value;
    		$$invalidate(3, email);
    	}

    	function span8_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			error[3] = $$value;
    			$$invalidate(5, error);
    		});
    	}

    	function input4_input_handler() {
    		phonenumber = this.value;
    		$$invalidate(4, phonenumber);
    	}

    	function span10_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			error[4] = $$value;
    			$$invalidate(5, error);
    		});
    	}

    	$$self.$capture_state = () => ({
    		match: K,
    		push,
    		link,
    		URL: URL$1,
    		sellerId,
    		sellerPw,
    		name,
    		email,
    		phonenumber,
    		error,
    		checkId,
    		checkPw,
    		checkName,
    		isEmailCorrect,
    		checkPhoneNum,
    		regist
    	});

    	$$self.$inject_state = $$props => {
    		if ('sellerId' in $$props) $$invalidate(0, sellerId = $$props.sellerId);
    		if ('sellerPw' in $$props) $$invalidate(1, sellerPw = $$props.sellerPw);
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('email' in $$props) $$invalidate(3, email = $$props.email);
    		if ('phonenumber' in $$props) $$invalidate(4, phonenumber = $$props.phonenumber);
    		if ('error' in $$props) $$invalidate(5, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		sellerId,
    		sellerPw,
    		name,
    		email,
    		phonenumber,
    		error,
    		regist,
    		input0_input_handler,
    		span2_binding,
    		input1_input_handler,
    		span4_binding,
    		input2_input_handler,
    		span6_binding,
    		input3_input_handler,
    		span8_binding,
    		input4_input_handler,
    		span10_binding
    	];
    }

    class Regist extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Regist",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\routes\seller\ProductRegist.svelte generated by Svelte v3.48.0 */

    const { console: console_1 } = globals;
    const file$3 = "src\\routes\\seller\\ProductRegist.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	child_ctx[29] = list;
    	child_ctx[30] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	child_ctx[32] = list;
    	child_ctx[33] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i];
    	child_ctx[36] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	child_ctx[38] = list;
    	child_ctx[36] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	return child_ctx;
    }

    // (198:32) {#each category as option}
    function create_each_block_4(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[28].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*option*/ ctx[28].code;
    			option.value = option.__value;
    			add_location(option, file$3, 198, 36, 6161);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*categories*/ 2 && t_value !== (t_value = /*option*/ ctx[28].name + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*categories*/ 2 && option_value_value !== (option_value_value = /*option*/ ctx[28].code)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(198:32) {#each category as option}",
    		ctx
    	});

    	return block;
    }

    // (190:24) {#each categories as category, index}
    function create_each_block_3(ctx) {
    	let select;
    	let option;
    	let mounted;
    	let dispose;
    	let each_value_4 = /*category*/ ctx[37];
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	function select_change_handler() {
    		/*select_change_handler*/ ctx[13].call(select, /*index*/ ctx[36]);
    	}

    	function change_handler() {
    		return /*change_handler*/ ctx[14](/*index*/ ctx[36]);
    	}

    	const block = {
    		c: function create() {
    			select = element("select");
    			option = element("option");
    			option.textContent = "===선택===";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			option.__value = "none";
    			option.value = option.__value;
    			add_location(option, file$3, 196, 32, 6025);
    			select.required = true;
    			attr_dev(select, "class", "svelte-191iz7j");
    			if (/*selectedCategories*/ ctx[2][/*index*/ ctx[36]] === void 0) add_render_callback(select_change_handler);
    			add_location(select, file$3, 190, 28, 5712);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectedCategories*/ ctx[2][/*index*/ ctx[36]]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", select_change_handler),
    					listen_dev(select, "change", change_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*categories*/ 2) {
    				each_value_4 = /*category*/ ctx[37];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}

    			if (dirty[0] & /*selectedCategories, categories*/ 6) {
    				select_option(select, /*selectedCategories*/ ctx[2][/*index*/ ctx[36]]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(190:24) {#each categories as category, index}",
    		ctx
    	});

    	return block;
    }

    // (294:36) {#each product.imageList as image, index}
    function create_each_block_2(ctx) {
    	let li;
    	let button;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[20](/*index*/ ctx[36]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			button.textContent = "이미지 지우기";
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			attr_dev(button, "class", "delite-image svelte-191iz7j");
    			add_location(button, file$3, 295, 44, 10583);
    			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[34].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "상품미리보기");
    			attr_dev(img, "class", "svelte-191iz7j");
    			add_location(img, file$3, 301, 44, 10957);
    			attr_dev(li, "class", "svelte-191iz7j");
    			add_location(li, file$3, 294, 40, 10533);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(li, t1);
    			append_dev(li, img);
    			append_dev(li, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*product*/ 1 && !src_url_equal(img.src, img_src_value = /*image*/ ctx[34].image)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(294:36) {#each product.imageList as image, index}",
    		ctx
    	});

    	return block;
    }

    // (356:32) {#each option.itemList as item, itemIdx}
    function create_each_block_1(ctx) {
    	let ul;
    	let li;
    	let label0;
    	let span0;
    	let t1;
    	let input0;
    	let t2;
    	let label1;
    	let span1;
    	let t4;
    	let input1;
    	let t5;
    	let button;
    	let mounted;
    	let dispose;

    	function input0_input_handler_1() {
    		/*input0_input_handler_1*/ ctx[24].call(input0, /*each_value_1*/ ctx[32], /*itemIdx*/ ctx[33]);
    	}

    	function input1_input_handler_1() {
    		/*input1_input_handler_1*/ ctx[25].call(input1, /*each_value_1*/ ctx[32], /*itemIdx*/ ctx[33]);
    	}

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[26](/*optionIdx*/ ctx[30], /*itemIdx*/ ctx[33]);
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li = element("li");
    			label0 = element("label");
    			span0 = element("span");
    			span0.textContent = "항목 이름";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			label1 = element("label");
    			span1 = element("span");
    			span1.textContent = "항목 추가금";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			button = element("button");
    			button.textContent = "항목삭제 X";
    			attr_dev(span0, "class", "svelte-191iz7j");
    			add_location(span0, file$3, 359, 48, 13582);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-191iz7j");
    			add_location(input0, file$3, 360, 48, 13650);
    			attr_dev(label0, "class", "item-name svelte-191iz7j");
    			add_location(label0, file$3, 358, 44, 13507);
    			attr_dev(span1, "class", "svelte-191iz7j");
    			add_location(span1, file$3, 367, 48, 14031);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "svelte-191iz7j");
    			add_location(input1, file$3, 368, 48, 14100);
    			attr_dev(label1, "class", "item-surcharge svelte-191iz7j");
    			add_location(label1, file$3, 366, 44, 13951);
    			attr_dev(button, "class", "delite-item-btn svelte-191iz7j");
    			add_location(button, file$3, 373, 44, 14406);
    			attr_dev(li, "class", "item svelte-191iz7j");
    			add_location(li, file$3, 357, 40, 13444);
    			attr_dev(ul, "class", "item-list");
    			add_location(ul, file$3, 356, 36, 13380);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li);
    			append_dev(li, label0);
    			append_dev(label0, span0);
    			append_dev(label0, t1);
    			append_dev(label0, input0);
    			set_input_value(input0, /*item*/ ctx[31].name);
    			append_dev(li, t2);
    			append_dev(li, label1);
    			append_dev(label1, span1);
    			append_dev(label1, t4);
    			append_dev(label1, input1);
    			set_input_value(input1, /*item*/ ctx[31].surcharge);
    			append_dev(li, t5);
    			append_dev(li, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", input0_input_handler_1),
    					listen_dev(input1, "input", input1_input_handler_1),
    					listen_dev(button, "click", click_handler_3, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*product*/ 1 && input0.value !== /*item*/ ctx[31].name) {
    				set_input_value(input0, /*item*/ ctx[31].name);
    			}

    			if (dirty[0] & /*product*/ 1 && to_number(input1.value) !== /*item*/ ctx[31].surcharge) {
    				set_input_value(input1, /*item*/ ctx[31].surcharge);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(356:32) {#each option.itemList as item, itemIdx}",
    		ctx
    	});

    	return block;
    }

    // (333:24) {#each product.optionList as option, optionIdx}
    function create_each_block(ctx) {
    	let li;
    	let label;
    	let span;
    	let t1;
    	let input;
    	let t2;
    	let div;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let t7;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[21].call(input, /*each_value*/ ctx[29], /*optionIdx*/ ctx[30]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[22](/*optionIdx*/ ctx[30]);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[23](/*optionIdx*/ ctx[30]);
    	}

    	let each_value_1 = /*option*/ ctx[28].itemList;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			label = element("label");
    			span = element("span");
    			span.textContent = "옵션명";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "항목 추가 +";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "옵션 삭제 X";
    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			attr_dev(span, "class", "svelte-191iz7j");
    			add_location(span, file$3, 335, 36, 12328);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-191iz7j");
    			add_location(input, file$3, 336, 36, 12382);
    			attr_dev(label, "class", "option-name svelte-191iz7j");
    			add_location(label, file$3, 334, 32, 12263);
    			attr_dev(button0, "class", "item-add-btn svelte-191iz7j");
    			add_location(button0, file$3, 343, 36, 12689);
    			attr_dev(button1, "class", "option-delete-btn svelte-191iz7j");
    			add_location(button1, file$3, 348, 36, 12973);
    			attr_dev(div, "class", "item-btn-grp svelte-191iz7j");
    			add_location(div, file$3, 342, 32, 12625);
    			attr_dev(li, "class", "option svelte-191iz7j");
    			add_location(li, file$3, 333, 28, 12210);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, label);
    			append_dev(label, span);
    			append_dev(label, t1);
    			append_dev(label, input);
    			set_input_value(input, /*option*/ ctx[28].name);
    			append_dev(li, t2);
    			append_dev(li, div);
    			append_dev(div, button0);
    			append_dev(div, t4);
    			append_dev(div, button1);
    			append_dev(li, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(li, null);
    			}

    			append_dev(li, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", input_input_handler),
    					listen_dev(button0, "click", click_handler_1, false, false, false),
    					listen_dev(button1, "click", click_handler_2, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*product*/ 1 && input.value !== /*option*/ ctx[28].name) {
    				set_input_value(input, /*option*/ ctx[28].name);
    			}

    			if (dirty[0] & /*deleteItem, product*/ 257) {
    				each_value_1 = /*option*/ ctx[28].itemList;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(li, t7);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(333:24) {#each product.optionList as option, optionIdx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div11;
    	let div10;
    	let h2;
    	let t1;
    	let div9;
    	let div8;
    	let fieldset0;
    	let legend0;
    	let t3;
    	let h30;
    	let t5;
    	let div0;
    	let strong0;
    	let t7;
    	let t8;
    	let label0;
    	let strong1;
    	let t10;
    	let input0;
    	let t11;
    	let label1;
    	let strong2;
    	let t13;
    	let input1;
    	let t14;
    	let fieldset1;
    	let legend1;
    	let t16;
    	let h31;
    	let t18;
    	let div6;
    	let div1;
    	let label2;
    	let span0;
    	let t20;
    	let input2;
    	let t21;
    	let label3;
    	let span1;
    	let t23;
    	let input3;
    	let t24;
    	let label4;
    	let span2;
    	let t26;
    	let input4;
    	let t27;
    	let div5;
    	let div2;
    	let img0;
    	let img0_src_value;
    	let t28;
    	let div4;
    	let div3;
    	let img1;
    	let img1_src_value;
    	let t29;
    	let ul0;
    	let t30;
    	let button0;
    	let t32;
    	let fieldset2;
    	let legend2;
    	let t34;
    	let h32;
    	let span3;
    	let t36;
    	let div7;
    	let button1;
    	let t38;
    	let ul1;
    	let mounted;
    	let dispose;
    	let each_value_3 = /*categories*/ ctx[1];
    	validate_each_argument(each_value_3);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_2[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*product*/ ctx[0].imageList;
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = /*product*/ ctx[0].optionList;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			div10 = element("div");
    			h2 = element("h2");
    			h2.textContent = "상품 등록하기";
    			t1 = space();
    			div9 = element("div");
    			div8 = element("div");
    			fieldset0 = element("fieldset");
    			legend0 = element("legend");
    			legend0.textContent = "상품 기본정보";
    			t3 = space();
    			h30 = element("h3");
    			h30.textContent = "상품 기본정보 등록";
    			t5 = space();
    			div0 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "카테고리";
    			t7 = space();

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t8 = space();
    			label0 = element("label");
    			strong1 = element("strong");
    			strong1.textContent = "상품명";
    			t10 = space();
    			input0 = element("input");
    			t11 = space();
    			label1 = element("label");
    			strong2 = element("strong");
    			strong2.textContent = "상품가격";
    			t13 = space();
    			input1 = element("input");
    			t14 = space();
    			fieldset1 = element("fieldset");
    			legend1 = element("legend");
    			legend1.textContent = "상품 이미지 등록";
    			t16 = space();
    			h31 = element("h3");
    			h31.textContent = "상품 이미지 정보 등록";
    			t18 = space();
    			div6 = element("div");
    			div1 = element("div");
    			label2 = element("label");
    			span0 = element("span");
    			span0.textContent = "대표사진 업로드";
    			t20 = space();
    			input2 = element("input");
    			t21 = space();
    			label3 = element("label");
    			span1 = element("span");
    			span1.textContent = "미리보기 사진 업로드";
    			t23 = space();
    			input3 = element("input");
    			t24 = space();
    			label4 = element("label");
    			span2 = element("span");
    			span2.textContent = "상품 상세이미지 업로드";
    			t26 = space();
    			input4 = element("input");
    			t27 = space();
    			div5 = element("div");
    			div2 = element("div");
    			img0 = element("img");
    			t28 = space();
    			div4 = element("div");
    			div3 = element("div");
    			img1 = element("img");
    			t29 = space();
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t30 = space();
    			button0 = element("button");
    			button0.textContent = "상품등록";
    			t32 = space();
    			fieldset2 = element("fieldset");
    			legend2 = element("legend");
    			legend2.textContent = "상품 옵션 등록";
    			t34 = space();
    			h32 = element("h3");
    			span3 = element("span");
    			span3.textContent = "상품 옵션 추가";
    			t36 = space();
    			div7 = element("div");
    			button1 = element("button");
    			button1.textContent = "옵션추가";
    			t38 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "page-title svelte-191iz7j");
    			add_location(h2, file$3, 180, 8, 5272);
    			add_location(legend0, file$3, 184, 20, 5439);
    			attr_dev(h30, "class", "section-title svelte-191iz7j");
    			add_location(h30, file$3, 186, 20, 5487);
    			attr_dev(strong0, "class", "svelte-191iz7j");
    			add_location(strong0, file$3, 188, 24, 5598);
    			attr_dev(div0, "class", "category svelte-191iz7j");
    			add_location(div0, file$3, 187, 20, 5550);
    			attr_dev(strong1, "class", "svelte-191iz7j");
    			add_location(strong1, file$3, 207, 24, 6510);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "product-name");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-191iz7j");
    			add_location(input0, file$3, 208, 24, 6556);
    			attr_dev(label0, "class", "product-name svelte-191iz7j");
    			add_location(label0, file$3, 206, 20, 6456);
    			attr_dev(strong2, "class", "svelte-191iz7j");
    			add_location(strong2, file$3, 216, 24, 6880);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "name", "product-price");
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-191iz7j");
    			add_location(input1, file$3, 217, 24, 6927);
    			attr_dev(label1, "class", "product-price svelte-191iz7j");
    			add_location(label1, file$3, 215, 20, 6825);
    			attr_dev(fieldset0, "class", "product-basic-info svelte-191iz7j");
    			add_location(fieldset0, file$3, 183, 16, 5380);
    			add_location(legend1, file$3, 227, 20, 7281);
    			attr_dev(h31, "class", "section-title svelte-191iz7j");
    			add_location(h31, file$3, 229, 20, 7331);
    			attr_dev(span0, "class", "svelte-191iz7j");
    			add_location(span0, file$3, 235, 32, 7622);
    			attr_dev(input2, "type", "file");
    			attr_dev(input2, "name", "main-thumbnail");
    			attr_dev(input2, "accept", ".jpg,.png,.jpeg");
    			input2.required = true;
    			attr_dev(input2, "class", "svelte-191iz7j");
    			add_location(input2, file$3, 236, 32, 7677);
    			attr_dev(label2, "class", "add-main-thumbnail svelte-191iz7j");
    			add_location(label2, file$3, 234, 28, 7554);
    			attr_dev(span1, "class", "svelte-191iz7j");
    			add_location(span1, file$3, 247, 32, 8196);
    			attr_dev(input3, "type", "file");
    			attr_dev(input3, "name", "sub-thumbnail");
    			attr_dev(input3, "accept", ".jpg,.png,.jpeg");
    			input3.multiple = true;
    			attr_dev(input3, "class", "svelte-191iz7j");
    			add_location(input3, file$3, 248, 32, 8254);
    			attr_dev(label3, "class", "add-sub-thumbnail svelte-191iz7j");
    			add_location(label3, file$3, 246, 28, 8129);
    			attr_dev(span2, "class", "svelte-191iz7j");
    			add_location(span2, file$3, 259, 32, 8766);
    			attr_dev(input4, "type", "file");
    			attr_dev(input4, "name", "detail-image");
    			attr_dev(input4, "accept", ".jpg,.png,.jpeg");
    			attr_dev(input4, "class", "svelte-191iz7j");
    			add_location(input4, file$3, 260, 32, 8825);
    			attr_dev(label4, "class", "add-detail-image svelte-191iz7j");
    			add_location(label4, file$3, 258, 28, 8700);
    			attr_dev(div1, "class", "add-thumbnails svelte-191iz7j");
    			add_location(div1, file$3, 232, 24, 7448);

    			if (!src_url_equal(img0.src, img0_src_value = /*product*/ ctx[0].detailInfo
    			? /*product*/ ctx[0].detailInfo
    			: 'images/product-detail-thumb.png')) attr_dev(img0, "src", img0_src_value);

    			attr_dev(img0, "alt", "상세이미지");
    			attr_dev(img0, "class", "svelte-191iz7j");
    			add_location(img0, file$3, 272, 32, 9384);
    			attr_dev(div2, "class", "detail-image-preview svelte-191iz7j");
    			add_location(div2, file$3, 271, 28, 9316);

    			if (!src_url_equal(img1.src, img1_src_value = /*product*/ ctx[0].thumbnail
    			? /*product*/ ctx[0].thumbnail
    			: 'images/product-main-thumb.png')) attr_dev(img1, "src", img1_src_value);

    			attr_dev(img1, "alt", "썸네일");
    			attr_dev(img1, "class", "svelte-191iz7j");
    			add_location(img1, file$3, 283, 36, 9938);
    			attr_dev(div3, "class", "main-thumbnail-preview svelte-191iz7j");
    			add_location(div3, file$3, 282, 32, 9864);
    			attr_dev(ul0, "class", "sub-thumbnail-preview svelte-191iz7j");
    			add_location(ul0, file$3, 292, 32, 10378);
    			attr_dev(div4, "class", "thumbnail-preview svelte-191iz7j");
    			add_location(div4, file$3, 280, 28, 9742);
    			attr_dev(div5, "class", "image-preview svelte-191iz7j");
    			add_location(div5, file$3, 269, 24, 9206);
    			attr_dev(div6, "class", "thumbnails svelte-191iz7j");
    			add_location(div6, file$3, 231, 20, 7398);
    			attr_dev(fieldset1, "class", "product-image svelte-191iz7j");
    			add_location(fieldset1, file$3, 226, 16, 7227);
    			attr_dev(button0, "class", "product-registration-btn svelte-191iz7j");
    			add_location(button0, file$3, 313, 16, 11414);
    			add_location(legend2, file$3, 319, 20, 11628);
    			attr_dev(span3, "class", "svelte-191iz7j");
    			add_location(span3, file$3, 322, 24, 11729);
    			attr_dev(button1, "class", "option-add-btn svelte-191iz7j");
    			add_location(button1, file$3, 324, 28, 11836);
    			attr_dev(div7, "class", "option-btn-group");
    			add_location(div7, file$3, 323, 24, 11776);
    			attr_dev(h32, "class", "section-title svelte-191iz7j");
    			add_location(h32, file$3, 321, 20, 11677);
    			attr_dev(ul1, "class", "option-list svelte-191iz7j");
    			add_location(ul1, file$3, 331, 20, 12083);
    			attr_dev(fieldset2, "class", "product-option svelte-191iz7j");
    			add_location(fieldset2, file$3, 318, 16, 11573);
    			add_location(div8, file$3, 182, 12, 5357);
    			attr_dev(div9, "class", "form-wrapper svelte-191iz7j");
    			add_location(div9, file$3, 181, 8, 5317);
    			attr_dev(div10, "class", "inner");
    			add_location(div10, file$3, 179, 4, 5243);
    			attr_dev(div11, "class", "container svelte-191iz7j");
    			add_location(div11, file$3, 178, 0, 5214);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div10);
    			append_dev(div10, h2);
    			append_dev(div10, t1);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, fieldset0);
    			append_dev(fieldset0, legend0);
    			append_dev(fieldset0, t3);
    			append_dev(fieldset0, h30);
    			append_dev(fieldset0, t5);
    			append_dev(fieldset0, div0);
    			append_dev(div0, strong0);
    			append_dev(div0, t7);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div0, null);
    			}

    			append_dev(fieldset0, t8);
    			append_dev(fieldset0, label0);
    			append_dev(label0, strong1);
    			append_dev(label0, t10);
    			append_dev(label0, input0);
    			set_input_value(input0, /*product*/ ctx[0].name);
    			append_dev(fieldset0, t11);
    			append_dev(fieldset0, label1);
    			append_dev(label1, strong2);
    			append_dev(label1, t13);
    			append_dev(label1, input1);
    			set_input_value(input1, /*product*/ ctx[0].price);
    			append_dev(div8, t14);
    			append_dev(div8, fieldset1);
    			append_dev(fieldset1, legend1);
    			append_dev(fieldset1, t16);
    			append_dev(fieldset1, h31);
    			append_dev(fieldset1, t18);
    			append_dev(fieldset1, div6);
    			append_dev(div6, div1);
    			append_dev(div1, label2);
    			append_dev(label2, span0);
    			append_dev(label2, t20);
    			append_dev(label2, input2);
    			append_dev(div1, t21);
    			append_dev(div1, label3);
    			append_dev(label3, span1);
    			append_dev(label3, t23);
    			append_dev(label3, input3);
    			append_dev(div1, t24);
    			append_dev(div1, label4);
    			append_dev(label4, span2);
    			append_dev(label4, t26);
    			append_dev(label4, input4);
    			append_dev(div6, t27);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div2, img0);
    			append_dev(div5, t28);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, img1);
    			append_dev(div4, t29);
    			append_dev(div4, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			append_dev(div8, t30);
    			append_dev(div8, button0);
    			append_dev(div8, t32);
    			append_dev(div8, fieldset2);
    			append_dev(fieldset2, legend2);
    			append_dev(fieldset2, t34);
    			append_dev(fieldset2, h32);
    			append_dev(h32, span3);
    			append_dev(h32, t36);
    			append_dev(h32, div7);
    			append_dev(div7, button1);
    			append_dev(fieldset2, t38);
    			append_dev(fieldset2, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[15]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[16]),
    					listen_dev(input2, "change", /*change_handler_1*/ ctx[17], false, false, false),
    					listen_dev(input3, "change", /*change_handler_2*/ ctx[18], false, false, false),
    					listen_dev(input4, "change", /*change_handler_3*/ ctx[19], false, false, false),
    					listen_dev(button0, "click", /*registProduct*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*appendOption*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedCategories, getChildren, categories*/ 14) {
    				each_value_3 = /*categories*/ ctx[1];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_3(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_3.length;
    			}

    			if (dirty[0] & /*product*/ 1 && input0.value !== /*product*/ ctx[0].name) {
    				set_input_value(input0, /*product*/ ctx[0].name);
    			}

    			if (dirty[0] & /*product*/ 1 && to_number(input1.value) !== /*product*/ ctx[0].price) {
    				set_input_value(input1, /*product*/ ctx[0].price);
    			}

    			if (dirty[0] & /*product*/ 1 && !src_url_equal(img0.src, img0_src_value = /*product*/ ctx[0].detailInfo
    			? /*product*/ ctx[0].detailInfo
    			: 'images/product-detail-thumb.png')) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty[0] & /*product*/ 1 && !src_url_equal(img1.src, img1_src_value = /*product*/ ctx[0].thumbnail
    			? /*product*/ ctx[0].thumbnail
    			: 'images/product-main-thumb.png')) {
    				attr_dev(img1, "src", img1_src_value);
    			}

    			if (dirty[0] & /*product, deleteImage*/ 4097) {
    				each_value_2 = /*product*/ ctx[0].imageList;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty[0] & /*product, deleteItem, deleteOption, appendItem*/ 449) {
    				each_value = /*product*/ ctx[0].optionList;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProductRegist', slots, []);
    	let categories = [];

    	onMount(async () => {
    		const sellerId = localStorage.getItem('sellerId');
    		const token = localStorage.getItem('token');

    		if (!token || !sellerId) {
    			alert('로그인 후 이용 가능합니다.');
    			push('/seller/login');
    			return;
    		}

    		$$invalidate(0, product.sellerId = sellerId, product);
    		const res = await fetch(`${URL$1}/api/v1/category/main`);
    		const jsonBody = await res.json();

    		$$invalidate(1, categories = [
    			jsonBody.map(value => {
    				const category = { code: value[0], name: value[1] };
    				return category;
    			})
    		]);
    	});

    	const getChildren = async code => {
    		$$invalidate(1, categories = categories.slice(0, code.length));
    		const res = await fetch(`${URL$1}/api/v1/category/${code}/children`);
    		const jsonBody = await res.json();

    		if (jsonBody !== null && jsonBody.length !== 0) {
    			$$invalidate(1, categories = [
    				...categories,
    				jsonBody.map(value => {
    					const category = { code: value[0], name: value[1] };
    					return category;
    				})
    			]);
    		} else {
    			$$invalidate(0, product.categoryCode = selectedCategories[selectedCategories.length - 1], product);
    			console.log(product.categoryCode);
    		}
    	};

    	const registProduct = async () => {
    		const sellerId = localStorage.getItem('sellerId');
    		const token = localStorage.getItem('token');

    		if (sellerId && token) {
    			const res = await fetch(`${URL$1}/api/v1/seller/${sellerId}/product`, {
    				method: 'POST',
    				headers: {
    					'Content-Type': 'application/json',
    					Authorization: token
    				},
    				body: JSON.stringify(product)
    			});

    			if (res.status === 200) {
    				const json = await res.json();

    				if (json === true) {
    					alert('상품을 등록했습니다.');
    					push('/seller');
    				} else {
    					alert('상품 등록에 실패했습니다.');
    					console.log(json.error);
    				}
    			} else if (res.status === 401) {
    				alert('로그인이 필요합니다.');
    				push('/seller/login');
    			} else if (res.status === 400) {
    				alert('상품 등록에 실패했습니다.');
    				console.log(res);
    			} else {
    				alert('상품 등록에 실패했습니다.');
    			}
    		} else {
    			alert('로그인 후 이용 가능합니다.');
    			push('/seller/login');
    		}
    	};

    	const appendOption = () => {
    		$$invalidate(
    			0,
    			product.optionList = [
    				...product.optionList,
    				{
    					name: '',
    					optionSequence: 1,
    					itemList: [{ name: '', itemSequence: 1, surcharge: 0 }]
    				}
    			],
    			product
    		);
    	};

    	const deleteOption = index => {
    		$$invalidate(0, product.optionList = product.optionList.filter((_, i) => i != index), product);
    	};

    	const appendItem = index => {
    		const last = product.optionList[index].itemList.length;

    		$$invalidate(
    			0,
    			product.optionList[index].itemList = [
    				...product.optionList[index].itemList,
    				{
    					name: '',
    					itemSequence: last + 1,
    					surcharge: 0
    				}
    			],
    			product
    		);
    	};

    	const deleteItem = (optionIndex, itemIndex) => {
    		$$invalidate(0, product.optionList[optionIndex].itemList = product.optionList[optionIndex].itemList.filter((_, i) => i != itemIndex), product);
    	};

    	let product = {
    		name: '',
    		sellerId: '',
    		categoryCode: '',
    		detailInfo: '',
    		thumbnail: '',
    		price: 0,
    		optionList: [
    			{
    				name: '',
    				optionSequence: 1,
    				itemList: [{ name: '', itemSequence: 1, surcharge: 0 }]
    			}
    		],
    		imageList: []
    	};

    	const getBase64 = file => {
    		return new Promise((resolve, reject) => {
    				const reader = new FileReader();
    				reader.readAsDataURL(file);
    				reader.onload = () => resolve(reader.result);
    				reader.onerror = error => reject(error);
    			});
    	};

    	const setThumbnail = async e => {
    		const image = e.target.files[0];
    		const imageStr = await getBase64(image);
    		$$invalidate(0, product.thumbnail = imageStr.toString(), product);
    	};

    	const setDetailInfo = async e => {
    		const image = e.target.files[0];
    		const imageStr = await getBase64(image);
    		$$invalidate(0, product.detailInfo = imageStr.toString(), product);
    	};

    	const addImage = async e => {
    		const image = e.target.files[0];
    		const imageStr = await getBase64(image);

    		$$invalidate(
    			0,
    			product.imageList = [
    				...product.imageList,
    				{
    					image: imageStr.toString(),
    					sequence: product.imageList.length
    				}
    			],
    			product
    		);
    	};

    	let selectedCategories = [];

    	const deleteImage = index => {
    		$$invalidate(0, product.imageList = product.imageList.filter((_, i) => i != index), product);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<ProductRegist> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler(index) {
    		selectedCategories[index] = select_value(this);
    		$$invalidate(2, selectedCategories);
    		$$invalidate(1, categories);
    	}

    	const change_handler = index => getChildren(selectedCategories[index]);

    	function input0_input_handler() {
    		product.name = this.value;
    		$$invalidate(0, product);
    	}

    	function input1_input_handler() {
    		product.price = to_number(this.value);
    		$$invalidate(0, product);
    	}

    	const change_handler_1 = e => setThumbnail(e);
    	const change_handler_2 = e => addImage(e);
    	const change_handler_3 = e => setDetailInfo(e);
    	const click_handler = index => deleteImage(index);

    	function input_input_handler(each_value, optionIdx) {
    		each_value[optionIdx].name = this.value;
    		$$invalidate(0, product);
    	}

    	const click_handler_1 = optionIdx => appendItem(optionIdx);
    	const click_handler_2 = optionIdx => deleteOption(optionIdx);

    	function input0_input_handler_1(each_value_1, itemIdx) {
    		each_value_1[itemIdx].name = this.value;
    		$$invalidate(0, product);
    	}

    	function input1_input_handler_1(each_value_1, itemIdx) {
    		each_value_1[itemIdx].surcharge = to_number(this.value);
    		$$invalidate(0, product);
    	}

    	const click_handler_3 = (optionIdx, itemIdx) => deleteItem(optionIdx, itemIdx);

    	$$self.$capture_state = () => ({
    		URL: URL$1,
    		onMount,
    		push,
    		categories,
    		getChildren,
    		registProduct,
    		appendOption,
    		deleteOption,
    		appendItem,
    		deleteItem,
    		product,
    		getBase64,
    		setThumbnail,
    		setDetailInfo,
    		addImage,
    		selectedCategories,
    		deleteImage
    	});

    	$$self.$inject_state = $$props => {
    		if ('categories' in $$props) $$invalidate(1, categories = $$props.categories);
    		if ('product' in $$props) $$invalidate(0, product = $$props.product);
    		if ('selectedCategories' in $$props) $$invalidate(2, selectedCategories = $$props.selectedCategories);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*product*/ 1) {
    			$$invalidate(0, product);
    		}
    	};

    	return [
    		product,
    		categories,
    		selectedCategories,
    		getChildren,
    		registProduct,
    		appendOption,
    		deleteOption,
    		appendItem,
    		deleteItem,
    		setThumbnail,
    		setDetailInfo,
    		addImage,
    		deleteImage,
    		select_change_handler,
    		change_handler,
    		input0_input_handler,
    		input1_input_handler,
    		change_handler_1,
    		change_handler_2,
    		change_handler_3,
    		click_handler,
    		input_input_handler,
    		click_handler_1,
    		click_handler_2,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		click_handler_3
    	];
    }

    class ProductRegist extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductRegist",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\seller\BeforeLogin.svelte generated by Svelte v3.48.0 */
    const file$2 = "src\\components\\seller\\BeforeLogin.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let h2;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let div0;
    	let button0;
    	let t4;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			t0 = text("MY SHOP");
    			br = element("br");
    			t1 = text("판매자 페이지");
    			t2 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "로그인";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "회원가입";
    			add_location(br, file$2, 10, 34, 253);
    			attr_dev(h2, "class", "page-title svelte-195bt8v");
    			add_location(h2, file$2, 10, 4, 223);
    			attr_dev(button0, "class", "login svelte-195bt8v");
    			add_location(button0, file$2, 12, 8, 310);
    			attr_dev(button1, "class", "sign-up svelte-195bt8v");
    			add_location(button1, file$2, 13, 8, 375);
    			attr_dev(div0, "class", "btn-group svelte-195bt8v");
    			add_location(div0, file$2, 11, 4, 277);
    			attr_dev(div1, "class", "container svelte-195bt8v");
    			add_location(div1, file$2, 9, 0, 194);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(h2, t0);
    			append_dev(h2, br);
    			append_dev(h2, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t4);
    			append_dev(div0, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*loginPage*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*registPage*/ ctx[0], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BeforeLogin', slots, []);

    	const registPage = () => {
    		push('/seller/regist');
    	};

    	const loginPage = () => {
    		push('/seller/login');
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BeforeLogin> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ push, registPage, loginPage });
    	return [registPage, loginPage];
    }

    class BeforeLogin extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BeforeLogin",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\seller\AfterLogin.svelte generated by Svelte v3.48.0 */
    const file$1 = "src\\components\\seller\\AfterLogin.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let h2;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let div0;
    	let button0;
    	let t4;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			t0 = text("MY SHOP");
    			br = element("br");
    			t1 = text("판매자 페이지");
    			t2 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "상품등록";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "로그아웃";
    			add_location(br, file$1, 11, 34, 291);
    			attr_dev(h2, "class", "page-title svelte-195bt8v");
    			add_location(h2, file$1, 11, 4, 261);
    			attr_dev(button0, "class", "product-registration svelte-195bt8v");
    			add_location(button0, file$1, 13, 8, 348);
    			attr_dev(button1, "class", "logout svelte-195bt8v");
    			add_location(button1, file$1, 16, 8, 457);
    			attr_dev(div0, "class", "btn-group svelte-195bt8v");
    			add_location(div0, file$1, 12, 4, 315);
    			attr_dev(div1, "class", "container svelte-195bt8v");
    			add_location(div1, file$1, 10, 0, 232);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(h2, t0);
    			append_dev(h2, br);
    			append_dev(h2, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t4);
    			append_dev(div0, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*productRegist*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*logout*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AfterLogin', slots, []);

    	const productRegist = () => {
    		push('/seller/product/regist');
    	};

    	const logout = () => {
    		localStorage.clear();
    		window.location.reload();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AfterLogin> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ push, productRegist, logout });
    	return [productRegist, logout];
    }

    class AfterLogin extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AfterLogin",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\routes\seller\Main.svelte generated by Svelte v3.48.0 */

    // (9:0) {:else}
    function create_else_block(ctx) {
    	let beforelogin;
    	let current;
    	beforelogin = new BeforeLogin({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(beforelogin.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(beforelogin, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(beforelogin.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(beforelogin.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(beforelogin, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(9:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (7:0) {#if sellerId}
    function create_if_block(ctx) {
    	let afterlogin;
    	let current;
    	afterlogin = new AfterLogin({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(afterlogin.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(afterlogin, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(afterlogin.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(afterlogin.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(afterlogin, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(7:0) {#if sellerId}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*sellerId*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Main', slots, []);
    	let sellerId;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ BeforeLogin, AfterLogin, sellerId });

    	$$self.$inject_state = $$props => {
    		if ('sellerId' in $$props) $$invalidate(0, sellerId = $$props.sellerId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(0, sellerId = localStorage.getItem('sellerId'));
    	return [sellerId];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.48.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let router;
    	let current;

    	router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(router.$$.fragment);
    			add_location(main, file, 31, 0, 1154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const routes = {
    		'/': Main$1,
    		'/product/search/:category/:keyword': ProductSearch,
    		'/product/detail/:productId': ProductDetail,
    		'/login': Login$1,
    		'/regist': Regist$1,
    		'/cart': Carts,
    		'/mypage': Mypage,
    		'/seller': Main,
    		'/seller/login': Login,
    		'/seller/regist': Regist,
    		'/seller/product/regist': ProductRegist
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		Main: Main$1,
    		ProductSearch,
    		ProductDetail,
    		Login: Login$1,
    		Regist: Regist$1,
    		Mypage,
    		Carts,
    		SellerLogin: Login,
    		SellerRegist: Regist,
    		ProductRegist,
    		SellerMain: Main,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
