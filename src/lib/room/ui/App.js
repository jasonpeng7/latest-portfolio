import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import HelpPrompt from './components/HelpPrompt';
import InterfaceUI from './components/InterfaceUI';
import eventBus from './EventBus';
const App = () => {
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        return eventBus.on('loadingScreenDone', () => {
            setLoading(false);
        });
    }, []);
    return (React.createElement("div", { id: "ui-app" },
        !loading && React.createElement(HelpPrompt, null)));
};
export function mountUI() {
 const main = createRoot(document.getElementById('ui'));
 const info = createRoot(document.getElementById('ui-interactive'));
 main.render(React.createElement(App));
 info.render(React.createElement(InterfaceUI));
 return () => { main.unmount(); info.unmount(); eventBus.clear(); };
}
