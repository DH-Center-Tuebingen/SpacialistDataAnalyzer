
var l10n;
function initL10N(lang) {
    l10n = eval('l10n_' + lang);
    l10n.get = (s, ...args) => {
        let r = l10n[s];
        args.forEach(a => r = r.replace('%s', a));
        return r;
    }
}
