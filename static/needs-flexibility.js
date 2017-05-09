// https://stackoverflow.com/a/27047981/2687646
const d = document.documentElement.style
const flexWrapIsSupported = !('flex' in d || 'WebkitFlex' in d);

export default flexWrapIsSupported;
