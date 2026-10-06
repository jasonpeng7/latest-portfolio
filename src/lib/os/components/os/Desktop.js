import React, { useCallback, useEffect, useRef, useState } from 'react';
import Colors from '../../constants/colors';
import ShowcaseExplorer from '../applications/ShowcaseExplorer';
import ShutdownSequence from './ShutdownSequence';
// import ThisComputer from '../applications/ThisComputer';
import Toolbar from './Toolbar';
import DesktopShortcut from './DesktopShortcut';
import Credits from '../applications/Credits';
import Spotify95 from '../applications/Spotify95';
import Photos from '../applications/Photos';
const APPLICATIONS = {
    // computer: {
    //     key: 'computer',
    //     name: 'This Computer',
    //     shortcutIcon: 'computerBig',
    //     component: ThisComputer,
    // },
    showcase: {
        key: 'showcase',
        name: 'My Showcase',
        shortcutIcon: 'showcaseIcon',
        component: ShowcaseExplorer,
    },
    spotify: {
        key: 'spotify',
        name: 'Spotify95',
        shortcutIcon: 'spotifyIcon',
        component: Spotify95,
    },
    photos: {
        key: 'photos',
        name: 'Photos',
        shortcutIcon: 'photosIcon',
        component: Photos,
    },
    credits: {
        key: 'credits',
        name: 'Credits',
        shortcutIcon: 'credits',
        component: Credits,
    },
};
const Desktop = (props) => {
    const [windows, setWindows] = useState({});
    const [shortcuts, setShortcuts] = useState([]);
    const readySent = useRef(false);
    useEffect(() => {
        if (readySent.current || window.parent === window || !shortcuts.length || !windows.showcase) return;
        let cancelled = false;
        Promise.resolve(document.fonts?.ready).then(() => {
            if (cancelled) return;
            readySent.current = true;
            window.parent.postMessage({ channel: 'jason-os', type: 'ready' }, window.location.origin);
        });
        return () => { cancelled = true; };
    }, [shortcuts.length, windows.showcase]);
    useEffect(() => {
        const types = ['mousedown','keydown'];
        const relay = event => {
            if (window.parent === window) return;
            window.parent.postMessage({ channel:'jason-os', type:event.type, key:event.key, button:event.button }, window.location.origin);
            if(event.type==='keydown' && event.key==='Escape') window.parent.postMessage({ channel:'jason-os', type:'exitMonitor' },window.location.origin);
        };
        types.forEach(type => document.addEventListener(type,relay));
        return () => types.forEach(type => document.removeEventListener(type,relay));
    }, []);
    const [shutdown, setShutdown] = useState(false);
    const [numShutdowns, setNumShutdowns] = useState(1);
    useEffect(() => {
        if (shutdown === true) {
            rebootDesktop();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shutdown]);
    useEffect(() => {
        const newShortcuts = [];
        Object.keys(APPLICATIONS).forEach((key) => {
            const app = APPLICATIONS[key];
            newShortcuts.push({
                shortcutName: app.name,
                icon: app.shortcutIcon,
                onOpen: () => {
                    addWindow(app.key, React.createElement(app.component, { onInteract: () => onWindowInteract(app.key), onMinimize: () => minimizeWindow(app.key), onClose: () => removeWindow(app.key), key: app.key }));
                },
            });
        });
        newShortcuts.forEach((shortcut) => {
            if (shortcut.shortcutName === 'My Showcase') {
                shortcut.onOpen();
            }
        });
        setShortcuts(newShortcuts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const rebootDesktop = useCallback(() => {
        setWindows({});
    }, []);
    const removeWindow = useCallback((key) => {
        // Absolute hack and a half
        setTimeout(() => {
            setWindows((prevWindows) => {
                const newWindows = { ...prevWindows };
                delete newWindows[key];
                return newWindows;
            });
        }, 100);
    }, []);
    const minimizeWindow = useCallback((key) => {
        setWindows((prevWindows) => {
            const newWindows = { ...prevWindows };
            if (!newWindows[key]) return prevWindows;
            newWindows[key] = { ...newWindows[key], minimized: true };
            return newWindows;
        });
    }, []);
    const getHighestZIndex = useCallback(() => {
        let highestZIndex = 0;
        Object.keys(windows).forEach((key) => {
            const window = windows[key];
            if (window) {
                if (window.zIndex > highestZIndex)
                    highestZIndex = window.zIndex;
            }
        });
        return highestZIndex;
    }, [windows]);
    const toggleMinimize = useCallback((key) => {
        const newWindows = { ...windows };
        const highestIndex = getHighestZIndex();
        if (newWindows[key].minimized ||
            newWindows[key].zIndex === highestIndex) {
            newWindows[key].minimized = !newWindows[key].minimized;
        }
        newWindows[key].zIndex = getHighestZIndex() + 1;
        setWindows(newWindows);
    }, [windows, getHighestZIndex]);
    const onWindowInteract = useCallback((key) => {
        setWindows((prevWindows) => ({
            ...prevWindows,
            [key]: {
                ...prevWindows[key],
                zIndex: Math.max(0, ...Object.values(prevWindows).map(item => item.zIndex)) + 1,
            },
        }));
    }, []);
    const startShutdown = useCallback(() => {
        setTimeout(() => {
            setShutdown(true);
            setNumShutdowns(numShutdowns + 1);
        }, 600);
    }, [numShutdowns]);
    const addWindow = useCallback((key, element) => {
        setWindows((prevState) => ({
            ...prevState,
            [key]: {
                zIndex: Math.max(0, ...Object.values(prevState).map(item => item.zIndex)) + 1,
                minimized: false,
                component: element,
                name: APPLICATIONS[key].name,
                icon: APPLICATIONS[key].shortcutIcon,
            },
        }));
    }, []);
    return !shutdown ? (React.createElement("div", { style: styles.desktop },
        Object.keys(windows).map((key) => {
            const element = windows[key].component;
            if (!element)
                return React.createElement("div", { key: `win-${key}` });
            return (React.createElement("div", { key: `win-${key}`, style: Object.assign({}, { zIndex: windows[key].zIndex }, windows[key].minimized && styles.minimized) }, React.cloneElement(element, {
                key,
                onInteract: () => onWindowInteract(key),
                onClose: () => removeWindow(key),
            })));
        }),
        React.createElement("div", { className: 'desktop-shortcuts', style: styles.shortcuts }, shortcuts.map((shortcut) => {
            return (React.createElement("div", { key: shortcut.shortcutName },
                React.createElement(DesktopShortcut, { icon: shortcut.icon, shortcutName: shortcut.shortcutName, onOpen: shortcut.onOpen })));
        })),
        React.createElement(Toolbar, { windows: windows, toggleMinimize: toggleMinimize, shutdown: startShutdown }))) : (React.createElement(ShutdownSequence, { setShutdown: setShutdown, numShutdowns: numShutdowns }));
};
const styles = {
    desktop: {
        minHeight: '100%',
        flex: 1,
        backgroundColor: Colors.turquoise,
    },
    shutdown: {
        minHeight: '100%',
        flex: 1,
        backgroundColor: '#1d2e2f',
    },
    shortcuts: {
        position: 'absolute',
        top: 16,
        left: 6,
    },
    minimized: {
        pointerEvents: 'none',
        opacity: 0,
    },
};
export default Desktop;
