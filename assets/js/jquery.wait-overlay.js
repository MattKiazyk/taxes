/*global jQuery:false */
/*global window:false */
(function($) {
    "use strict";
    var defaultOptions = {
        title: "",
        text: "",
        extraCssClasses: [],
        overrideGeometry: {
            top: undefined,
            left: undefined,
            width: undefined,
            height: undefined
        }
    };
    var WaitOverlay = function(overlayThis, options) {
        this._waitCount = 0;
        this._parent = overlayThis;
        this._options = $.extend({}, defaultOptions, options);
    };
    WaitOverlay.prototype = {
        get waitCount() {
            return this._waitCount;
        },
        show: function() {
            if (this._waitCount++) {
                return;
            }
            this._buildAndDisplay();
            this._parent.data("waitOverlay", this);
        },
        unshow: function() {
            if (--this._waitCount === 0) {
                this._removeSelf();
            }
        },
        _buildAndDisplay: function() {
            var self = this;
            this._createOverlay()
                    ._addTitle()
                    ._addText()
                    ._addWaitClassArea()
                    ._waitForParentToStabilize()
                    .done(function() {
                        self._display();
                    });
        },
        _createOverlay: function() {
            return this._parentIsWindow() ? this._createWindowOverlay() : this._createRegularOverlay();
        },
        _createWindowOverlay: function() {
            this._overlay = $("<div></div>")
                    .css("position", "fixed")
                    .css("display", "table")
                    .css("z-index", "9999")
                    .css("width", "100%")
                    .css("height", "100%")
                    .css("top", "0")
                    .css("left", "0")
                    .css("margin-left", "0")
                    .css("margin-top", "0")
                    .addClass("wait-overlay")
                    .addClass("wait-overlay-window");
            this._ensureOverlayIsNotTransparent();
            this._applyExtraCssClassesTo(this._overlay);
            return this;
        },
        _createRegularOverlay: function() {
            var parent = $(this._parent);
            var parentPosition = parent.position();
            var parentMargins = this._getMarginsOf(parent);
            this._overlay = $("<div></div>")
                .css("position", "absolute")
                .css("display", "table")
                .css("z-index", "9999")
                .width(parent.outerWidth())
                .height(parent.outerHeight())
                .css("left", parentPosition.left)
                .css("top", parentPosition.top)
                .css(parentMargins)
                .addClass("wait-overlay");
            this._applyExtraCssClassesTo(this._overlay);
            return this;
        },
        _getMarginsOf: function(el) {
            return {
                marginLeft: el.css('margin-left'),
                marginRight: el.css('margin-right'),
                marginTop: el.css('margin-top'),
                marginBottom: el.css('margin-bottom')
            };
        },
        _applyExtraCssClassesTo: function(el) {
            this._options.extraCssClasses.forEach(function(className) {
                el.addClass(className);
            });
        },
        _getParentGeometry: function() {
            if (this._options.overrideGeometry) {
                return this._options.overrideGeometry;
            }
            var offset = $(this._parent).offset();
            return {
                left: offset.left,
                top: offset.top,
                width: $(this._parent).outerWidth(),
                height: $(this._parent).outerHeight(),
                marginLeft: $(this._parent).css('margin-left'),
                marginRight: $(this._parent).css('margin-right')
            };
        },
        _addWaitClassArea: function() {
            var waitAreaInner = $("<div></div>")
                    .addClass("wait");
            var waitAreaLens = $("<div></div>")
                    .addClass("wait-lens");
            var area = $("<div></div>");
            area.append(waitAreaInner);
            area.append(waitAreaLens);
            this._overlay.append(area);
            this._waitArea = area;
            return this;
        },
        _addTitle: function() {
            if (this._options.title) {
                var titleArea = $("<div></div>")
                        .css("text-align", "center")
                        .css("margin", "0px")
                        .addClass("wait-title-container");
                var title = $("<span></span>")
                        .css("margin", "0px")
                        .text(this._options.title)
                        .addClass("wait-title");
                titleArea.append(title);
                this._titleArea = titleArea;
                this._overlay.append(titleArea);
            }
            return this;
        },
        _addText: function() {
            if (this._options.text) {
                var textArea = $("<div></div>").addClass("wait-text-container")
                        .css("margin", "0px")
                        .css("width", "100%");
                var textBody = $("<span></span>")
                        .text(this._options.text)
                        .css("white-space", "pre-wrap")
                        .addClass("wait-text");
                textArea.append(textBody);
                this._textArea = textArea;
                this._overlay.append(textArea);
            }
            return this;
        },
        _display: function() {
            if (this._parentIsWindow()) {
                $("body").append(this._overlay);
            } else {
                $(this._parent.parent()).append(this._overlay);
            }
            this._keepSizeInSync();
        },
        _checkIfParentHasStabilised: function(usingDeferred, lastGeometry) {
            if (!this._waitCount) {
                usingDeferred.reject();
            }
            var currentGeometry = this._getParentGeometry();
            var waitSomeMore = (lastGeometry === undefined);
            if (!waitSomeMore) {
                for (var k in currentGeometry) {
                    if (currentGeometry[k] !== lastGeometry[k]) {
                        waitSomeMore = true;
                        break;
                    }
                }
            }
            if (waitSomeMore) {
                var self = this;
                window.setTimeout(function() {
                    self._checkIfParentHasStabilised(usingDeferred, currentGeometry);
                }, 50);
                return;
            }
            usingDeferred.resolve(currentGeometry);
        },
        _waitForParentToStabilize: function() {
            var usingDeferred = new $.Deferred();
            this._checkIfParentHasStabilised(usingDeferred);
            return usingDeferred.promise();
        },
        _keepSizeInSync: function() {
            if (this._parent.is(":visible")) {
                var grandparent = (this._parent.parent &&
                        this._parent.parent()) ||
                        this._parent;
                if (grandparent.length === 0) {
                    grandparent = $("html");
                }
                if (grandparent.find(".wait-overlay").length) {
                    var resized = this._resizeInnerContentToFit();
                    var self = this;
                    window.setTimeout(function() {
                        self._keepSizeInSync(true);
                    }, resized ? 25 : 100);
                }
            }
        },
        _resizeInnerContentToFit: function() {
            var resized = false;
            if (this._textArea) {
                resized = this._resizedTextArea();
            } else {
                resized = this._resizedWaitArea();
            }
            return resized;
        },
        _resizedWaitArea: function() {
            var originalHeight = this._waitArea.height();
            var waitAreaHeight = this._getParentHeight();
            if (this._titleArea) {
                waitAreaHeight -= this._titleArea.outerHeight();
            }
            if (originalHeight !== waitAreaHeight) {
                this._waitArea.height(waitAreaHeight);
                return true;
            }
            return false;
        },
        _resizedTextArea: function() {
            var originalHeight = this._textArea.height();
            var textAreaHeight = this._getParentHeight() - this._waitArea.outerHeight();
            if (this._titleArea) {
                textAreaHeight -= this._titleArea.outerHeight();
            }
            if (originalHeight !== textAreaHeight) {
                this._textArea.height(textAreaHeight);
                return true;
            }
            return false;
        },
        _parentIsWindow: function() {
            return this._parent[0] === window;
        },
        _createBackingOverlay: function() {
            if (this._parentIsWindow()) {
                return;
            }
            this._backingOverlay = $(this._parent).clone();
            this._backingOverlay
                    .addClass("wait-overlay-backing")
                    .css("opacity", this._options.backingOverlayOpacity);
            $(this._backingOverlay).find("*").attr("disabled", "disabled");
            $(this._parent.parent()).append(this._backingOverlay);
            this._parent.hide();
        },
        _removeSelf: function() {
            this._parent.data("waitOverlay", null);
            this._overlay.remove();
            if (this._backingOverlay) {
                this._backingOverlay.remove();
            }
            this._parent.show();
        },
        _getParentWidth: function() {
            /* sometimes margins and stuff make child elements go south ): */
            var width = this._parent.width();
            var parentLeft = this._parent.offset().left;
            var parentRight = parentLeft + width;
            var children = this._parent.find("*:visible");
            var childLeft, childRight;
            for (var i = 0; i < children.length; i++) {
                childLeft = $(children[i]).offset().left;
                childRight = childLeft + $(children[i]).width();
                childRight += this._getCssIntVal(children[i], "padding-left");
                childRight += this._getCssIntVal(children[i], "padding-right");
                if (childRight > parentRight) {
                    parentRight = childRight;
                }
            }
            return parentRight - parentLeft;
        },
        _getParentHeight: function() {
            if (this._options.overrideGeometry.height !== undefined) {
                return this._options.overrideGeometry.height;
            }
            /* sometimes margins and stuff make child elements go south ): */
            var height = this._parent.height();
            var parentTop = this._parent.offset().top;
            var parentBottom = parentTop + height;
            var children = this._parent.find("*:visible");
            var childTop, childBottom;
            for (var i = 0; i < children.length; i++) {
                childTop = $(children[i]).offset().top;
                childBottom = childTop + $(children[i]).height();
                childBottom += this._getCssIntVal(children[i], "padding-top");
                childBottom += this._getCssIntVal(children[i], "padding-bottom");
                if (childBottom > parentBottom) {
                    parentBottom = childBottom;
                }
            }
            return parentBottom - parentTop;
        },
        _getCssIntVal: function(el, prop) {
            var val = $(el).css(prop);
            if (!val) {
                return 0;
            }
            val = val.replace(/px/, "");
            try {
                return parseInt(val, 10);
            } catch (e) {
                return 0;
            }
        }
    };
    $.fn.wait = function(options) {
        var deferred = new $.Deferred();
        if (this.length === 0) {
            return deferred.promise();
        }
        options = options || {};
        for (var i = 0; i < this.length; i++) {
            var el = this[i];
            if (el === window) {
                options.overrideGeometry = {
                    left: 0,
                    top: 0,
                    width: window.innerWidth,
                    height: window.innerHeight
                };
            }
            var existingOverlay = $(el).data("waitOverlay");
            var waitOverlay = existingOverlay || new WaitOverlay($(el), options);
            waitOverlay.show();
        }
        return deferred.promise();
    };
    $.fn.unwait = function() {
        for (var i = 0; i < this.length; i++) {
            var el = $(this.get(i));
            var existingOverlay = el.data("waitOverlay");
            if (existingOverlay) {
                existingOverlay.unshow();
            }
        }
    };
    window.TestExports = window.TestExports || {};
    window.TestExports = $.extend({}, window.TestExports, {WaitOverlay: WaitOverlay});
    // spy on wait for parent to prevent async problems with testing
    if (window.jasmine) {
        WaitOverlay.prototype._waitForParentToStabilize = function() {
            var deferred = new $.Deferred();
            deferred.resolve({});
            return deferred.promise();
        };
    }
})(jQuery);
