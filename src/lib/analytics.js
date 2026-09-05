// Esto era originalmente un envoltorio delgado alrededor de `react-ga`, que solo admite UA.
// Ahora usamos GTM, por lo que podríhamos usar `react-gtm-module`, pero no admite entornos GTM (GTM_ENV_AUTH).
// Por lo tanto, utilizamos los fragmentos de GTM directamente.


/**
 * Report analytics to GA4 using an interface similar to the 'react-ga' module we were using for UA.
 */
const GA4 = {
    event: ({category, action, label}) => {
        window.dataLayer = window.dataLayer || [];
        // No hay un mapeo perfecto de UA a GA4
        // Ver https://support.google.com/analytics/answer/11091025
        window.dataLayer.push({
            event: category,
            action,
            label
        });
    }
};

export default GA4;
