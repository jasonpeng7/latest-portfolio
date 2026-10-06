const listeners = new Map();
const latest = new Map();
const EventBus = {
 on(event, callback) { const handler = e => callback(e.detail); if(!listeners.has(event)) listeners.set(event,new Map()); listeners.get(event).set(callback,handler); document.addEventListener(event,handler); if (latest.has(event)) callback(latest.get(event)); return () => this.remove(event,callback); },
 dispatch(event,data) { if (event === 'loadedSource' || event === 'loadingScreenDone') latest.set(event,data); document.dispatchEvent(new CustomEvent(event,{detail:data})); },
 remove(event,callback) { const handler=listeners.get(event)?.get(callback); if(handler) document.removeEventListener(event,handler); listeners.get(event)?.delete(callback); },
 clear() { listeners.forEach((callbacks,event) => callbacks.forEach(handler => document.removeEventListener(event,handler))); listeners.clear(); latest.clear(); }
};
export default EventBus;
