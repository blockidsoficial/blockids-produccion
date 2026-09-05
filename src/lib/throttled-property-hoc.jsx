import React from 'react';

/* Higher Order Component to throttle updates to specific props.
 * Why? Because certain prop updates are expensive, and need to be throttled.
 * This allows renders when other properties change, and will use the last
 * rendered value of a prop for comparison.
 * @param {string} propName the name of the prop to throttle updates from.
 * @param {string} throttleTime the minimum time between updates to that specific property.
 * @returns {function} a function that accepts a component to wrap.
 */
const ThrottledPropertyHOC = function (propName, throttleTime) {
    /**
     * The function to be called with a React component to wrap it.
     * @param {React.Component} WrappedComponent - Component to wrap with throttler.
     * @returns {React.Component} the component wrapped with the throttler.
     */
    return function (WrappedComponent) {
        class ThrottledPropertyWrapper extends React.Component {
            shouldComponentUpdate (nextProps) {
                for (const property in nextProps) {
                    if (property !== propName && this.props[property] !== nextProps[property]) {
                        return true; // Siempre actualiza si otra propiedad ha cambiado
                    }
                }

                // Si solo esa propiedad ha cambiado, permite que la actualización se renderice según
                // _lastRenderedTime y _lastRenderTime se actualizan en render
                if (nextProps[propName] !== this._lastRenderedValue &&
                    Date.now() - this._lastRenderTime > throttleTime
                ) {
                    return true; // Permite que esta actualización se renderice
                }

                return false;
            }
            render () {
                this._lastRenderTime = Date.now();
                this._lastRenderedValue = this.props[propName];
                return (
                    <WrappedComponent {...this.props} />
                );
            }
        }

        return ThrottledPropertyWrapper;
    };
};

export default ThrottledPropertyHOC;
