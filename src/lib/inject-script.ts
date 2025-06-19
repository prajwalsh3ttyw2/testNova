// export const INJECT_SCRIPT = `
//   // Ensure the script only runs once
//   if (!window.__testRecorder) {
//     class WebviewTestRecorder {
//       constructor() {
//         this.attachEventListeners();
//         console.log('Test recorder initialized');
//         // Add visual indicator
//         const style = document.createElement('style');
//         style.textContent = \`
//           .recording-highlight { outline: 2px solid red !important; }
//         \`;
//         document.head.appendChild(style);

//         // Handle iframes
//         this.observeIframes();

//         // Handle popups
//         this.handlePopups();
//       }

//       handlePopups() {
//         // Store original window.open
//         const originalOpen = window.open;
//         window.open = (...args) => {
//           const popup = originalOpen.apply(window, args);
//           if (popup) {
//             try {
//               // Wait for popup to load
//               setTimeout(() => {
//                 this.injectIntoPopup(popup);
//               }, 500);
//             } catch (error) {
//               console.error('Error handling popup:', error);
//             }
//           }
//           return popup;
//         };
//       }

//       injectIntoPopup(popup) {
//         try {
//           // Inject styles
//           const style = popup.document.createElement('style');
//           style.textContent = \`
//             .recording-highlight { outline: 2px solid red !important; }
//           \`;
//           popup.document.head.appendChild(style);

//           // Attach event listeners
//           this.attachEventListenersToDocument(popup.document, { type: 'popup', src: popup.location.href });

//           // Handle iframes in popup
//           this.observeIframesInWindow(popup);
//         } catch (error) {
//           console.error('Error injecting into popup:', error);
//         }
//       }

//       observeIframes() {
//         // Handle existing iframes
//         this.attachToIframes();

//         // Watch for new iframes in main window
//         this.observeIframesInWindow(window);
//       }

//       observeIframesInWindow(win) {
//         try {
//           const observer = new MutationObserver((mutations) => {
//             mutations.forEach((mutation) => {
//               mutation.addedNodes.forEach((node) => {
//                 if (node instanceof win.HTMLIFrameElement) {
//                   this.attachToIframe(node);
//                 }
//                 // Handle dynamically added content
//                 if (node instanceof win.Element) {
//                   const iframes = node.getElementsByTagName('iframe');
//                   Array.from(iframes).forEach(iframe => this.attachToIframe(iframe));
//                 }
//               });
//             });
//           });

//           observer.observe(win.document.body, {
//             childList: true,
//             subtree: true,
//             attributes: true,
//             characterData: true
//           });
//         } catch (error) {
//           console.error('Error observing iframes:', error);
//         }
//       }

//       attachToIframes() {
//         document.querySelectorAll('iframe').forEach(iframe => {
//           this.attachToIframe(iframe);
//         });
//       }

//       attachToIframe(iframe) {
//         try {
//           const handleIframeLoad = () => {
//             try {
//               const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
//               if (iframeDoc) {
//                 // Inject styles into iframe
//                 const style = iframeDoc.createElement('style');
//                 style.textContent = \`
//                   .recording-highlight { outline: 2px solid red !important; }
//                 \`;
//                 iframeDoc.head.appendChild(style);

//                 // Inject necessary scripts for dynamic UI functionality
//                 this.injectScriptsIntoIframe(iframeDoc);

//                 // Attach event listeners
//                 this.attachEventListenersToDocument(iframeDoc, {
//                   type: 'iframe',
//                   src: iframe.src,
//                   selector: this.generateSelector(iframe)
//                 });

//                 // Handle nested iframes
//                 iframeDoc.querySelectorAll('iframe').forEach(nestedIframe => {
//                   this.attachToIframe(nestedIframe);
//                 });

//                 // Observe for new iframes and dynamic content within this iframe
//                 this.observeIframesInWindow(iframe.contentWindow);

//                 // Observe dynamic changes in iframe content
//                 this.observeDynamicContent(iframeDoc);

//                 console.log('Attached listeners to iframe:', iframe.src);
//               }
//             } catch (error) {
//               console.error('Error accessing iframe content:', error);
//             }
//           };

//           // Override postMessage to ensure it works across frames
//           const originalPostMessage = iframe.contentWindow?.postMessage;
//           if (originalPostMessage) {
//             iframe.contentWindow.postMessage = function(...args) {
//               try {
//                 originalPostMessage.apply(this, args);
//               } catch (error) {
//                 console.error('Error in postMessage:', error);
//               }
//             };
//           }

//           iframe.addEventListener('load', handleIframeLoad);

//           // Try immediate attachment if already loaded
//           if (iframe.contentDocument?.readyState === 'complete') {
//             handleIframeLoad();
//           }

//           // Handle iframe src changes
//           const originalSrc = iframe.src;
//           Object.defineProperty(iframe, 'src', {
//             set: function(value) {
//               const oldValue = this.src;
//               if (oldValue !== value) {
//                 setTimeout(() => handleIframeLoad(), 100);
//               }
//               return value;
//             },
//             get: function() {
//               return originalSrc;
//             }
//           });

//           // Monitor iframe visibility changes
//           const observer = new IntersectionObserver((entries) => {
//             entries.forEach(entry => {
//               if (entry.isIntersecting) {
//                 handleIframeLoad();
//               }
//             });
//           });
//           observer.observe(iframe);
//         } catch (error) {
//           console.error('Error attaching to iframe:', error);
//         }
//       }

//       injectScriptsIntoIframe(iframeDoc) {
//         try {
//           // Inject necessary polyfills and utilities
//           const script = iframeDoc.createElement('script');
//           script.textContent = \`
//             // Ensure basic JS functionality
//             if (!window.requestAnimationFrame) {
//               window.requestAnimationFrame = function(callback) {
//                 return setTimeout(callback, 0);
//               };
//             }

//             // Add custom event support
//             if (!window.CustomEvent || typeof window.CustomEvent !== 'function') {
//               window.CustomEvent = function(event, params) {
//                 params = params || { bubbles: false, cancelable: false, detail: null };
//                 var evt = document.createEvent('CustomEvent');
//                 evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
//                 return evt;
//               };
//             }

//             // Override addEventListener to capture dynamic registrations
//             const originalAddEventListener = EventTarget.prototype.addEventListener;
//             EventTarget.prototype.addEventListener = function(type, listener, options) {
//               if (this instanceof Element) {
//                 const element = this;
//                 const wrappedListener = function(event) {
//                   listener.call(element, event);
//                   // Notify parent about the event
//                   window.parent.postMessage({
//                     type: 'DYNAMIC_EVENT',
//                     eventType: type,
//                     selector: element.tagName.toLowerCase(),
//                     timestamp: Date.now()
//                   }, '*');
//                 };
//                 originalAddEventListener.call(this, type, wrappedListener, options);
//               } else {
//                 originalAddEventListener.call(this, type, listener, options);
//               }
//             };

//             // Override MutationObserver to better handle dynamic changes
//             const OriginalMutationObserver = window.MutationObserver;
//             window.MutationObserver = class extends OriginalMutationObserver {
//               constructor(callback) {
//                 super((mutations) => {
//                   callback(mutations);
//                   // Notify parent about dynamic changes
//                   window.parent.postMessage({
//                     type: 'DYNAMIC_CHANGE',
//                     timestamp: Date.now()
//                   }, '*');
//                 });
//               }
//             };
//           \`;
//           iframeDoc.head.appendChild(script);

//           // Listen for messages from iframe
//           window.addEventListener('message', (event) => {
//             if (event.data.type === 'DYNAMIC_EVENT' || event.data.type === 'DYNAMIC_CHANGE') {
//               console.log('Received message from iframe:', event.data);
//             }
//           });
//         } catch (error) {
//           console.error('Error injecting scripts into iframe:', error);
//         }
//       }

//       observeDynamicContent(doc) {
//         try {
//           const observer = new MutationObserver((mutations) => {
//             mutations.forEach((mutation) => {
//               // Handle added nodes
//               mutation.addedNodes.forEach((node) => {
//                 if (node instanceof Element) {
//                   // Re-attach event listeners to new content
//                   this.attachEventListenersToElement(node);

//                   // Handle any new iframes
//                   const iframes = node.getElementsByTagName('iframe');
//                   Array.from(iframes).forEach(iframe => this.attachToIframe(iframe));
//                 }
//               });

//               // Handle attribute changes that might affect event handlers
//               if (mutation.type === 'attributes' && mutation.target instanceof Element) {
//                 this.attachEventListenersToElement(mutation.target);
//               }
//             });
//           });

//           observer.observe(doc, {
//             childList: true,
//             subtree: true,
//             attributes: true,
//             attributeFilter: ['onclick', 'onchange', 'oninput', 'onsubmit']
//           });
//         } catch (error) {
//           console.error('Error observing dynamic content:', error);
//         }
//       }

//       attachEventListenersToElement(element) {
//         // Handle inline event handlers
//         const eventAttributes = ['onclick', 'onchange', 'oninput', 'onsubmit'];
//         eventAttributes.forEach(attr => {
//           if (element.hasAttribute(attr)) {
//             const eventType = attr.slice(2); // Remove 'on' prefix
//             const originalHandler = element[attr];
//             element[attr] = (event) => {
//               if (originalHandler) {
//                 originalHandler.call(element, event);
//               }
//               this.handleEvent(eventType, event);
//             };
//           }
//         });

//         // Handle elements with click handlers added via addEventListener
//         if (element.onclick || element.click) {
//           element.addEventListener('click', (e) => this.handleEvent('click', e), true);
//         }

//         // Handle dynamic UI elements
//         if (element.getAttribute('role') === 'button' ||
//             element.classList.contains('button') ||
//             element.tagName.toLowerCase() === 'button') {
//           element.addEventListener('click', (e) => this.handleEvent('click', e), true);
//         }
//       }

//       attachEventListenersToDocument(doc, context = null) {
//         const events = ['click', 'input', 'change', 'submit'];
//         events.forEach(eventType => {
//           doc.addEventListener(eventType, (e) => {
//             if (e.target instanceof Element) {
//               // Check if the event is from a modal/dialog
//               const isModal = e.target.closest('dialog, [role="dialog"], [aria-modal="true"]');
//               const modalContext = isModal ? {
//                 type: 'modal',
//                 selector: this.generateSelector(isModal)
//               } : null;

//               this.handleEvent(eventType, e, context || modalContext);
//             }
//           }, true);
//         });

//         // Track navigation
//         if (context?.type === 'popup' || context?.type === 'iframe') {
//           this.attachNavigationTracking(doc, context);
//         }

//         // Add mouseover effect
//         doc.addEventListener('mouseover', (e) => {
//           if (e.target instanceof Element) {
//             e.target.classList.add('recording-highlight');
//           }
//         }, true);

//         doc.addEventListener('mouseout', (e) => {
//           if (e.target instanceof Element) {
//             e.target.classList.remove('recording-highlight');
//           }
//         }, true);

//         // Observe dynamic content
//         this.observeDynamicContent(doc);

//         // Attach listeners to all existing elements
//         doc.querySelectorAll('*').forEach(element => {
//           this.attachEventListenersToElement(element);
//         });
//       }

//       attachNavigationTracking(doc, context) {
//         const pushState = history.pushState;
//         history.pushState = function() {
//           const ret = pushState.apply(this, arguments);
//           window.dispatchEvent(new Event('pushstate'));
//           window.dispatchEvent(new Event('locationchange'));
//           return ret;
//         };

//         const replaceState = history.replaceState;
//         history.replaceState = function() {
//           const ret = replaceState.apply(this, arguments);
//           window.dispatchEvent(new Event('replacestate'));
//           window.dispatchEvent(new Event('locationchange'));
//           return ret;
//         };

//         window.addEventListener('popstate', () => {
//           window.dispatchEvent(new Event('locationchange'));
//         });

//         window.addEventListener('locationchange', () => {
//           this.handleEvent('navigation', {
//             target: doc.documentElement,
//             type: 'navigation',
//             url: doc.location.href
//           }, context);
//         });
//       }

//       attachEventListeners() {
//         this.attachEventListenersToDocument(document);
//         this.attachNavigationTracking(document, null);
//       }

//       handleEvent(type, event, context = null) {
//         const target = event.target;
//         if (!(target instanceof Element)) return;

//         const selector = this.generateSelector(target, context);
//         const value = this.getElementValue(target);
//         const tagName = target.tagName.toLowerCase();

//         const recordedEvent = {
//           type,
//           selector,
//           tagName,
//           timestamp: Date.now(),
//           value,
//           text: target.textContent?.trim() || '',
//           context: context ? {
//             type: context.type,
//             src: context.src || '',
//             selector: context.selector || ''
//           } : null
//         };

//         // Visual feedback
//         target.style.outline = '2px solid green';
//         setTimeout(() => {
//           target.style.outline = '';
//         }, 500);

//         // Send event to parent window using console.log
//         console.log(JSON.stringify({
//           type: 'RECORDED_EVENT',
//           event: recordedEvent
//         }));
//       }

//       getElementValue(element) {
//         if (element instanceof HTMLInputElement) {
//           return element.value;
//         } else if (element instanceof HTMLSelectElement) {
//           return element.value;
//         } else if (element instanceof HTMLTextAreaElement) {
//           return element.value;
//         }
//         return null;
//       }

//       generateSelector(element, context = null) {
//         let selector = '';

//         // If element is inside an iframe or modal, we need to handle it differently
//         if (context) {
//           if (context.type === 'iframe') {
//             selector = 'iframe';
//             if (context.selector) {
//               selector = context.selector + ' ';
//             }
//           } else if (context.type === 'modal') {
//             selector = context.selector + ' ';
//           }
//         }

//         // Try data-testid first
//         if (element.getAttribute('data-testid')) {
//           return selector + '[data-testid="' + element.getAttribute('data-testid') + '"]';
//         }

//         // Try ID
//         if (element.id) {
//           return selector + '#' + element.id;
//         }

//         // Try name attribute
//         if (element.getAttribute('name')) {
//           return selector + '[name="' + element.getAttribute('name') + '"]';
//         }

//         // Try aria-label
//         if (element.getAttribute('aria-label')) {
//           return selector + '[aria-label="' + element.getAttribute('aria-label') + '"]';
//         }

//         // Try role
//         if (element.getAttribute('role')) {
//           const role = element.getAttribute('role');
//           const roleElements = document.querySelectorAll(\`[role="\${role}"]\`);
//           if (roleElements.length === 1) {
//             return selector + \`[role="\${role}"]\`;
//           }
//         }

//         // Try classes but filter out dynamic/utility classes
//         if (element.classList.length > 0) {
//           const classes = Array.from(element.classList)
//             .filter(cls => !cls.includes('hover:') && !cls.includes('focus:'));
//           if (classes.length > 0) {
//             return selector + '.' + classes.join('.');
//           }
//         }

//         // Fallback to tag with nth-child
//         let elementSelector = element.tagName.toLowerCase();
//         const parent = element.parentElement;

//         if (parent) {
//           const siblings = Array.from(parent.children);
//           const sameTagSiblings = siblings.filter(sibling =>
//             sibling.tagName === element.tagName
//           );

//           if (sameTagSiblings.length > 1) {
//             const index = sameTagSiblings.indexOf(element);
//             elementSelector += ':nth-child(' + (index + 1) + ')';
//           }
//         }

//         return selector + elementSelector;
//       }
//     }

//     // Store the recorder instance globally
//     window.__testRecorder = new WebviewTestRecorder();
//     console.log('Test recorder script injected and initialized successfully');
//   } else {
//     console.log('Test recorder already initialized');
//   }
// `;

// export const INJECT_SCRIPT = `
//   // Ensure the script only runs once
//   if (!window.__testRecorder) {
//     class WebviewTestRecorder {
//       constructor() {
//         this.attachEventListeners();
//         console.log('Test recorder initialized');
//         // Add visual indicator
//         const style = document.createElement('style');
//         style.textContent = \`
//           .recording-highlight { outline: 2px solid red !important; }
//         \`;
//         document.head.appendChild(style);

//         // Handle iframes and popups
//         this.observeIframes();
//         this.handlePopups();
//       }

//       // --- UPDATED: Full XPath Generation Logic ---
//       // This function now generates the full, unabbreviated XPath from the root.
//       _generateXPath(element) {
//         // If the element is invalid, return an empty string.
//         if (!element || element.nodeType !== Node.ELEMENT_NODE) {
//           return '';
//         }

//         const path = [];
//         // Traverse up the DOM tree from the element to the HTML root.
//         while (element && element.nodeType === Node.ELEMENT_NODE) {
//           let index = 1;
//           // Count preceding siblings with the same tag name to determine the index.
//           for (let sibling = element.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
//             if (sibling.nodeName === element.nodeName) {
//               index++;
//             }
//           }

//           const tagName = element.nodeName.toLowerCase();
//           // Create the path segment with the tag name and its calculated index.
//           const pathIndex = \`[\${index}]\`;

//           // Prepend the segment to the path array.
//           path.unshift(tagName + pathIndex);

//           // Move up to the next parent element.
//           element = element.parentNode;
//         }

//         // Join all segments to form the final, full XPath string, starting with a '/'.
//         return path.length ? '/' + path.join('/') : '';
//       }

//       // --- MODIFIED: Event Handler ---
//       // Now captures both selector and the full XPath.
//       handleEvent(type, event, context = null) {
//         const target = event.target;
//         if (!(target instanceof Element)) return;

//         // Generate both identifiers
//         const selector = this.generateSelector(target, context);
//         const xpath = this._generateXPath(target); // Generate the full XPath
//         const value = this.getElementValue(target);
//         const tagName = target.tagName.toLowerCase();

//         const recordedEvent = {
//           type,
//           selector,
//           xpath, // Include full XPath in the event payload
//           tagName,
//           timestamp: Date.now(),
//           value,
//           text: target.textContent?.trim() || '',
//           context: context ? {
//             type: context.type,
//             src: context.src || '',
//             selector: context.selector || ''
//           } : null
//         };

//         // Visual feedback
//         target.style.outline = '2px solid green';
//         setTimeout(() => {
//           target.style.outline = '';
//         }, 500);

//         // Send event to host app via console.log
//         console.log(JSON.stringify({
//           type: 'RECORDED_EVENT',
//           event: recordedEvent
//         }));
//       }

//       // All other methods from your script remain the same...
//       // (handlePopups, observeIframes, generateSelector, etc.)
//       handlePopups() {
//         const originalOpen = window.open;
//         window.open = (...args) => {
//           const popup = originalOpen.apply(window, args);
//           if (popup) {
//             try {
//               setTimeout(() => this.injectIntoPopup(popup), 500);
//             } catch (error) { console.error('Error handling popup:', error); }
//           }
//           return popup;
//         };
//       }
//       injectIntoPopup(popup) {
//         try {
//           const style = popup.document.createElement('style');
//           style.textContent = \`.recording-highlight { outline: 2px solid red !important; }\`;
//           popup.document.head.appendChild(style);
//           this.attachEventListenersToDocument(popup.document, { type: 'popup', src: popup.location.href });
//           this.observeIframesInWindow(popup);
//         } catch (error) { console.error('Error injecting into popup:', error); }
//       }
//       observeIframes() {
//         this.attachToIframes();
//         this.observeIframesInWindow(window);
//       }
//       observeIframesInWindow(win) {
//         try {
//           const observer = new MutationObserver((mutations) => {
//             mutations.forEach((mutation) => {
//               mutation.addedNodes.forEach((node) => {
//                 if (node instanceof win.HTMLIFrameElement) { this.attachToIframe(node); }
//                 if (node instanceof win.Element) {
//                   const iframes = node.getElementsByTagName('iframe');
//                   Array.from(iframes).forEach(iframe => this.attachToIframe(iframe));
//                 }
//               });
//             });
//           });
//           observer.observe(win.document.body, { childList: true, subtree: true });
//         } catch (error) { console.error('Error observing iframes:', error); }
//       }
//       attachToIframes() {
//         document.querySelectorAll('iframe').forEach(iframe => this.attachToIframe(iframe));
//       }
//       attachToIframe(iframe) {
//         try {
//           const handleIframeLoad = () => {
//             try {
//               const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
//               if (iframeDoc) {
//                 const style = iframeDoc.createElement('style');
//                 style.textContent = \`.recording-highlight { outline: 2px solid red !important; }\`;
//                 iframeDoc.head.appendChild(style);
//                 this.attachEventListenersToDocument(iframeDoc, { type: 'iframe', src: iframe.src, selector: this.generateSelector(iframe) });
//                 this.observeIframesInWindow(iframe.contentWindow);
//               }
//             } catch (error) { console.error('Error accessing iframe content:', error); }
//           };
//           iframe.addEventListener('load', handleIframeLoad);
//           if (iframe.contentDocument?.readyState === 'complete') { handleIframeLoad(); }
//         } catch (error) { console.error('Error attaching to iframe:', error); }
//       }
//       attachEventListenersToDocument(doc, context = null) {
//         const events = ['click', 'input', 'change', 'submit'];
//         events.forEach(eventType => {
//           doc.addEventListener(eventType, (e) => {
//             if (e.target instanceof Element) {
//               this.handleEvent(eventType, e, context);
//             }
//           }, true);
//         });
//         doc.addEventListener('mouseover', (e) => { if (e.target instanceof Element) e.target.classList.add('recording-highlight'); }, true);
//         doc.addEventListener('mouseout', (e) => { if (e.target instanceof Element) e.target.classList.remove('recording-highlight'); }, true);
//       }
//       attachEventListeners() { this.attachEventListenersToDocument(document); }
//       getElementValue(element) {
//         if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
//           return element.value;
//         }
//         return null;
//       }
//       generateSelector(element, context = null) {
//         let selector = '';
//         if (context) {
//           if (context.type === 'iframe' && context.selector) { selector = context.selector + ' '; }
//         }
//         if (element.getAttribute('data-testid')) { return selector + \`[data-testid="\${element.getAttribute('data-testid')}"]\`; }
//         if (element.id) { return selector + '#' + element.id; }
//         if (element.getAttribute('name')) { return selector + \`[name="\${element.getAttribute('name')}"]\`; }
//         if (element.getAttribute('aria-label')) { return selector + \`[aria-label="\${element.getAttribute('aria-label')}"]\`; }

//         let path = '';
//         let current = element;
//         while(current && current.nodeType === Node.ELEMENT_NODE && current.tagName.toLowerCase() !== 'body') {
//             let elementSelector = current.tagName.toLowerCase();
//             const parent = current.parentElement;
//             if (parent) {
//                 const siblings = Array.from(parent.children);
//                 const sameTagSiblings = siblings.filter(sibling => sibling.tagName === current.tagName);
//                 if (sameTagSiblings.length > 1) {
//                     const index = sameTagSiblings.indexOf(current);
//                     elementSelector += \`:nth-of-type(\${index + 1})\`;
//                 }
//             }
//             path = elementSelector + (path ? ' > ' + path : '');
//             current = current.parentElement;
//         }
//         return selector + path;
//       }
//     }
//     window.__testRecorder = new WebviewTestRecorder();
//     console.log('Test recorder script injected and initialized successfully');
//   } else {
//     console.log('Test recorder already initialized');
//   }
// `;

export const INJECT_SCRIPT = `
  // Ensure the script only runs once
  if (!window.__testRecorder) {
    class WebviewTestRecorder {
      constructor() {
        this.attachEventListeners();
        console.log('Test recorder initialized');
        // Add visual indicator
        const style = document.createElement('style');
        style.textContent = \`
          .recording-highlight { outline: 2px solid red !important; }
        \`;
        document.head.appendChild(style);

        // Handle iframes and popups
        this.observeIframes();
        this.handlePopups();
      }

      // --- UPDATED: Full XPath Generation Logic ---
      // This function now generates the full, unabbreviated XPath from the root.
      _generateXPath(element) {
        // If the element is invalid, return an empty string.
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
          return '';
        }
        
        const path = [];
        // Traverse up the DOM tree from the element to the HTML root.
        while (element && element.nodeType === Node.ELEMENT_NODE) {
          let index = 1;
          // Count preceding siblings with the same tag name to determine the index.
          for (let sibling = element.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
            if (sibling.nodeName === element.nodeName) {
              index++;
            }
          }

          const tagName = element.nodeName.toLowerCase();
          // Create the path segment with the tag name and its calculated index.
          const pathIndex = \`[\${index}]\`;
          
          // Prepend the segment to the path array.
          path.unshift(tagName + pathIndex);
          
          // Move up to the next parent element.
          element = element.parentNode;
        }

        // Join all segments to form the final, full XPath string, starting with a '/'.
        return path.length ? '/' + path.join('/') : '';
      }

      // --- MODIFIED: Event Handler ---
      // Now captures both selector and the full XPath.
      handleEvent(type, event, context = null) {
        const target = event.target;
        if (!(target instanceof Element)) return;

        // Generate both identifiers
        const selector = this.generateSelector(target, context);
        const xpath = this._generateXPath(target); // Generate the full XPath
        const value = this.getElementValue(target);
        const placeholder = this.getElementPlaceholder(target); // Get placeholder text
        const tagName = target.tagName.toLowerCase();
        
        const recordedEvent = {
          type,
          selector,
          xpath, // Include full XPath in the event payload
          tagName,
          timestamp: Date.now(),
          value,
          placeholder, // Include placeholder text in the event payload
          text: target.textContent?.trim() || '',
          context: context ? {
            type: context.type,
            src: context.src || '',
            selector: context.selector || ''
          } : null
        };

        // Visual feedback
        target.style.outline = '2px solid green';
        setTimeout(() => {
          target.style.outline = '';
        }, 500);

        // Send event to host app via console.log
        console.log(JSON.stringify({
          type: 'RECORDED_EVENT',
          event: recordedEvent
        }));
      }
      
      // --- NEW: Get placeholder text from input elements ---
      getElementPlaceholder(element) {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          return element.placeholder || null;
        }
        return null;
      }
      
      // All other methods from your script remain the same...
      // (handlePopups, observeIframes, generateSelector, etc.)
      handlePopups() {
        const originalOpen = window.open;
        window.open = (...args) => {
          const popup = originalOpen.apply(window, args);
          if (popup) {
            try {
              setTimeout(() => this.injectIntoPopup(popup), 500);
            } catch (error) { console.error('Error handling popup:', error); }
          }
          return popup;
        };
      }
      injectIntoPopup(popup) {
        try {
          const style = popup.document.createElement('style');
          style.textContent = \`.recording-highlight { outline: 2px solid red !important; }\`;
          popup.document.head.appendChild(style);
          this.attachEventListenersToDocument(popup.document, { type: 'popup', src: popup.location.href });
          this.observeIframesInWindow(popup);
        } catch (error) { console.error('Error injecting into popup:', error); }
      }
      observeIframes() {
        this.attachToIframes();
        this.observeIframesInWindow(window);
      }
      observeIframesInWindow(win) {
        try {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              mutation.addedNodes.forEach((node) => {
                if (node instanceof win.HTMLIFrameElement) { this.attachToIframe(node); }
                if (node instanceof win.Element) {
                  const iframes = node.getElementsByTagName('iframe');
                  Array.from(iframes).forEach(iframe => this.attachToIframe(iframe));
                }
              });
            });
          });
          observer.observe(win.document.body, { childList: true, subtree: true });
        } catch (error) { console.error('Error observing iframes:', error); }
      }
      attachToIframes() {
        document.querySelectorAll('iframe').forEach(iframe => this.attachToIframe(iframe));
      }
      attachToIframe(iframe) {
        try {
          const handleIframeLoad = () => {
            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
              if (iframeDoc) {
                const style = iframeDoc.createElement('style');
                style.textContent = \`.recording-highlight { outline: 2px solid red !important; }\`;
                iframeDoc.head.appendChild(style);
                this.attachEventListenersToDocument(iframeDoc, { type: 'iframe', src: iframe.src, selector: this.generateSelector(iframe) });
                this.observeIframesInWindow(iframe.contentWindow);
              }
            } catch (error) { console.error('Error accessing iframe content:', error); }
          };
          iframe.addEventListener('load', handleIframeLoad);
          if (iframe.contentDocument?.readyState === 'complete') { handleIframeLoad(); }
        } catch (error) { console.error('Error attaching to iframe:', error); }
      }
      attachEventListenersToDocument(doc, context = null) {
        const events = ['click', 'input', 'change', 'submit'];
        events.forEach(eventType => {
          doc.addEventListener(eventType, (e) => {
            if (e.target instanceof Element) {
              this.handleEvent(eventType, e, context);
            }
          }, true);
        });
        doc.addEventListener('mouseover', (e) => { if (e.target instanceof Element) e.target.classList.add('recording-highlight'); }, true);
        doc.addEventListener('mouseout', (e) => { if (e.target instanceof Element) e.target.classList.remove('recording-highlight'); }, true);
      }
      attachEventListeners() { this.attachEventListenersToDocument(document); }
      getElementValue(element) {
        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
          return element.value;
        }
        return null;
      }
      generateSelector(element, context = null) {
        let selector = '';
        if (context) {
          if (context.type === 'iframe' && context.selector) { selector = context.selector + ' '; }
        }
        if (element.getAttribute('data-testid')) { return selector + \`[data-testid="\${element.getAttribute('data-testid')}"]\`; }
        if (element.id) { return selector + '#' + element.id; }
        if (element.getAttribute('name')) { return selector + \`[name="\${element.getAttribute('name')}"]\`; }
        if (element.getAttribute('aria-label')) { return selector + \`[aria-label="\${element.getAttribute('aria-label')}"]\`; }
        
        let path = '';
        let current = element;
        while(current && current.nodeType === Node.ELEMENT_NODE && current.tagName.toLowerCase() !== 'body') {
            let elementSelector = current.tagName.toLowerCase();
            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children);
                const sameTagSiblings = siblings.filter(sibling => sibling.tagName === current.tagName);
                if (sameTagSiblings.length > 1) {
                    const index = sameTagSiblings.indexOf(current);
                    elementSelector += \`:nth-of-type(\${index + 1})\`;
                }
            }
            path = elementSelector + (path ? ' > ' + path : '');
            current = current.parentElement;
        }
        return selector + path;
      }
    }
    window.__testRecorder = new WebviewTestRecorder();
    console.log('Test recorder script injected and initialized successfully');
  } else {
    console.log('Test recorder already initialized');
  }
`;
