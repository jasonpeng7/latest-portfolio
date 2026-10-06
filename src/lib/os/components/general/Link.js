import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
const Link = (props) => {
    const navigate = useNavigate();
    // get current location of react router
    const location = useLocation();
    const [isHere, setIsHere] = useState(false);
    // if current path is the same as the link path
    useEffect(() => {
        if (location.pathname === `/${props.to}`) {
            setIsHere(true);
        }
        else {
            setIsHere(false);
        }
        return () => { };
    }, [location, props.to]);
    const [active, setActive] = useState(false);
    const handleClick = (e) => {
        let isMounted = true;
        e.preventDefault();
        setActive(true);
        if (location.pathname !== `/${props.to}`) {
            setTimeout(() => {
                if (isMounted)
                    navigate(`/${props.to}`);
            }, 100);
        }
        let t = setTimeout(() => {
            if (isMounted)
                setActive(false);
        }, 100);
        return () => {
            isMounted = false;
            clearTimeout(t);
        };
    };
    return (React.createElement(RouterLink, { to: `/${props.to}`, onClick: handleClick, style: Object.assign({}, { display: 'flex' }, props.containerStyle) },
        isHere && React.createElement("div", { style: styles.hereIndicator }),
        React.createElement("h4", { className: "router-link", style: Object.assign({}, styles.link, active && { color: 'red' }) }, props.text)));
};
const styles = {
    link: {
        cursor: 'pointer',
        fontWeight: 'bolder',
        textDecoration: 'underline',
    },
    hereIndicator: {
        width: 4,
        height: 4,
        borderWidth: 3,
        borderStyle: 'solid',
        borderColor: 'rgb(85, 26, 139)',
        alignSelf: 'center',
        borderRadius: '50%',
        marginRight: 6,
        textDecoration: 'none',
    },
};
export default Link;
