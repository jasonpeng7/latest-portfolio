const windowResize = "/os-assets/icons/windowResize.png";
const maximize = "/os-assets/icons/maximize.png";
const minimize = "/os-assets/icons/minimize.png";
const computerBig = "/os-assets/icons/computerBig.png";
const computerSmall = "/os-assets/icons/computerSmall.png";
const myComputer = "/os-assets/icons/myComputer.png";
const showcaseIcon = "/os-assets/icons/showcase-j.svg";
const doomIcon = "/os-assets/icons/doomIcon.png";
const henordleIcon = "/os-assets/icons/henordleIcon.png";
const credits = "/os-assets/icons/credits.png";
const spotifyIcon = "/os-assets/icons/spotify95.svg";
const volumeOn = "/os-assets/icons/volumeOn.png";
const volumeOff = "/os-assets/icons/volumeOff.png";
const trailIcon = "/os-assets/icons/trailIcon.png";
const windowGameIcon = "/os-assets/icons/windowGameIcon.png";
const windowExplorerIcon = "/os-assets/icons/windowExplorerIcon.png";
const windowsStartIcon = "/os-assets/icons/windowsStartIcon.png";
const scrabbleIcon = "/os-assets/icons/scrabbleIcon.png";
const close = "/os-assets/icons/close.png";
const icons = {
    windowResize: windowResize,
    maximize: maximize,
    minimize: minimize,
    computerBig: computerBig,
    computerSmall: computerSmall,
    myComputer: myComputer,
    showcaseIcon: showcaseIcon,
    doomIcon: doomIcon,
    volumeOn: volumeOn,
    volumeOff: volumeOff,
    credits: credits,
    spotifyIcon,
    scrabbleIcon: scrabbleIcon,
    henordleIcon: henordleIcon,
    close: close,
    windowGameIcon: windowGameIcon,
    windowExplorerIcon: windowExplorerIcon,
    windowsStartIcon: windowsStartIcon,
    trailIcon: trailIcon,
};
const getIconByName = (iconName
// @ts-ignore
) => icons[iconName];
export default getIconByName;
