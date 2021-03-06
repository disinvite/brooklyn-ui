// NO SLEEP TILL BROOKLYN

function bkSelectbox($document, $interval) {
    return {
        restrict: 'E',
        
        template:
            '<div class="brooklyn brooklyn-select">' +
            '<button class="btn btn-default brooklyn-select-button">' +
            '<label></label>' +
            '<span>stuff</span>' +
            '<i class="caret pull-right"></i>' +
            '</button>' +
            '<div class="brooklyn-select-textbox">' +
            '<label></label>' +
            '<input type="text" class="" ng-model="val" disabled />' +
            '</div>' +
            '<ul class="brooklyn-select-results" ng-show="filtered.length > 0">' +
            '<li ng-repeat="v in values | filter: val | orderBy:order as filtered" ng-class="{\'active\': $index == selindex}">' +
            '<a href ng-click="select($index,1)">' +
            '<div ng-bind="getDisplayCol(v)"/>' +
            '<small ng-if="getShowSub(v)" ng-bind="getSubCol(v)" />' +
            '</a>' +
            '</li>' +
            '</ul>' +
            '<input class="focus-trap" type="text" />' +
            '</div>',
        require: 'ngModel',
        scope: {
            values: '=',
            order: '=orderBy',
            disabled: '=ngDisabled',
            displayColumn: '@',
            valueColumn: '@',
            subColumn: '@',
            showSub: '@',
        },
        link: function(scope, element, attrs, ngModelCtrl) {
            element.find('label').text(attrs.placeholder);
            var el_main = element.find('.brooklyn');
            var el_select_button = element.find('.brooklyn-select-button');
            var el_select_button_contents = el_select_button.find('span');
            var el_select_textbox = element.find('.brooklyn-select-textbox');
            var el_select_input = el_select_textbox.find('input');
            var el_select_results = element.find('.brooklyn-select-results');
            var el_focus_trap = element.find('.focus-trap');
            el_select_input.attr('placeholder',attrs.placeholder);
            
            scope.val = '';
            scope.selindex = 0;
            scope.clickedOption = false;
            scope.opened = false;
            var mousedown = false;
            var blur_interval;
            
            scope.$watch('disabled', function() {
                if(scope.disabled) {
                    el_select_button.addClass('brooklyn-disabled');
                } else {
                    el_select_button.removeClass('brooklyn-disabled');
                }
                el_select_button.prop('disabled', scope.disabled);
                el_focus_trap.prop('disabled', scope.disabled);
            });
            
            scope.$watch('values', function() {
                if(scope.values == undefined) {
                    return;
                }
                
                var cols = Object.keys(scope.values[0]);
                if(scope.valueColumn == undefined) {
                    scope.valueColumn = cols[0];
                }
                
                if(scope.displayColumn == undefined) {
                    scope.displayColumn = scope.valueColumn;
                }
                
                scope.getValueCol = function(row) {
                    return scope.$eval(scope.valueColumn,row);
                }
                
                scope.getDisplayCol = function(row) {
                    return scope.$eval(scope.displayColumn,row);
                }
                
                scope.getSubCol = function(row) {
                    return scope.$eval(scope.subColumn,row);
                }
                
                if((scope.showSub == undefined) && (scope.subColumn == undefined)) {
                    scope.getShowSub = function(row) {
                        return false;
                    }
                } else {
                    if(scope.showSub == undefined) {
                        scope.getShowSub = function(row) {
                            return true;
                        }
                    } else {
                        scope.getShowSub = function(row) {
                            return scope.$eval(scope.showSub,row);
                        }
                    }
                }
                
            });
            
            
            function onDocumentClick(e) {
                if (!scope.opened) { 
                    return;
                }

                var contains = window.jQuery.contains(element[0], e.target);
                console.log('doc click ' + contains);
                if(!contains) {
                    scope.select(scope.selindex,0);
                }
            }

            //$document.on('click', onDocumentClick);
            $document.on('mouseup', onDocumentClick);

            scope.$on('$destroy', function() {
                //$document.off('click', onDocumentClick);
                $document.off('mouseup', onDocumentClick);
            });
            
            // hide the button element and show the textbox/results window
            function open() {
                if(scope.disabled) { return; }
                scope.opened = true;
                scope.clickedOption = false;
                el_main.addClass('opened');
                el_main.addClass('active');
                el_main.removeClass('showLabel');
                el_select_input.attr('disabled',false);
                el_select_input.focus();
                el_focus_trap.attr('disabled',true);
                scope.$apply(function() {
                    scroll_to(scope.selindex);
                });
            }
            
            function close() {
                scope.opened = false;
                el_main.removeClass('opened');
                el_main.removeClass('active');
                el_select_input.attr('disabled',true);
                el_focus_trap.attr('disabled',false);
            }
            
            el_select_button.click(open);
            
            ngModelCtrl.$formatters.push(function(modelValue) {
                return modelValue || '';
            });

            ngModelCtrl.$render = function() {
                var val = ngModelCtrl.$viewValue;
                el_main.toggleClass('showLabel', !ngModelCtrl.$isEmpty(val));
                el_select_button_contents.toggleClass('placeholder', ngModelCtrl.$isEmpty(val));
                if(ngModelCtrl.$isEmpty(val)) {
                    el_select_button_contents.text(attrs.placeholder);
                } else {
                    el_select_button_contents.text(val);
                }
            }

            scope.select = function(index,clickEvent) {
                scope.clickedOption = clickEvent;
                scope.val = '';
                
                if(index != -1) {
                    scope.selindex = index;
                    ngModelCtrl.$setViewValue( scope.getValueCol(scope.filtered[index]) );
                    ngModelCtrl.$render();
                } else {
                    ngModelCtrl.$setViewValue('');
                    ngModelCtrl.$render();
                }
                close();
                if(clickEvent) {
                    el_focus_trap.focus();
                }
            }

            ngModelCtrl.$parsers.push(function(viewValue) {
                return viewValue || '';
            });
            
            // clicked off the input box, so try to use whatever is selected as our value
            el_select_input.blur(function(event) {
                if (angular.isDefined(blur_interval)) return;
                blur_interval = $interval(function() {
                    if(!mousedown) {
                        $interval.cancel(blur_interval);
                        if(!scope.clickedOption) {
                            scope.select(scope.selindex,0);
                        }
                    }
                },100);
            });
            
            el_select_results.on('mousedown mouseup', 'li', function(event) {
                 if (event.type == 'mousedown') {
                    mousedown = true;
                 } else if (event.type == 'mouseup') {
                    mousedown = false;
                 }
            });

            // watch for changes to the results filter
            scope.$watch('val', function() {
                if(scope.opened) {
                    el_main.toggleClass('showLabel',!ngModelCtrl.$isEmpty(scope.val));
                    scope.selindex = scope.filtered.length > 0 ? 0 : -1;
                    scroll_to(scope.selindex);
                }
            });

            el_focus_trap.focus(function(event) {
                if(!scope.opened) {
                    el_main.addClass('active');
                }
            });
            el_focus_trap.blur(function(event) {
                if(!scope.opened) {
                    el_main.removeClass('active');
                }
            });
            
            el_focus_trap.on('keydown', function(event) {
                switch(event.which) {
                    case 13: //enter key
                    case 38: //up arrow
                    case 40: //down arrow
                        open();
                        return event.which;
                        break;
                }
            });
            
            function scroll_to(which) {
                    var height_top = 0;
                    var height_bottom = 0;
                    el_select_results.children('li').each(function(index) {
                        if(which > index) {
                            height_top += $(this).height();
                        }
                        if(which >= index) {
                            height_bottom += $(this).height();
                        }
                    });
                    
                    if(el_select_results.scrollTop() > height_top) {
                        // scroll so that higlighted element is at the top of the box
                        el_select_results.scrollTop(height_top);
                    } else if ((el_select_results.scrollTop() + 200) < height_bottom) {
                        // scroll so that higlighted element is at the bottom of the box
                        el_select_results.scrollTop(height_bottom - 200);
                    }
                }
            
            el_select_input.on('keydown', function(event) {
                scope.$apply(function() {
                    switch(event.which) {
                        case 9: // tab key
                        case 13: //enter key
                            scope.select(scope.selindex,1);
                            el_focus_trap.focus();
                            break;
                        case 38: //up arrow
                            if(scope.selindex > 0) {
                                scope.selindex--;
                                scroll_to(scope.selindex);
                            }
                            break;
                        case 40: //down arrow
                            if(scope.selindex < (scope.filtered.length - 1)) {
                                scope.selindex++;
                                scroll_to(scope.selindex);
                            }
                            break;
                    }
                });
            });
        }
    };
}

function bkTextbox() {
    return {
        restrict: 'E',
        template:
            '<div class="brooklyn brooklyn-textbox">' +
            '<label></label>' +
            '<input type="text" ng-model="val"/>' +
            '</div>',
        require: 'ngModel',
        scope: {
            disabled: '=ngDisabled',
            list: '=ngList'
        },
        link: function(scope, element, attrs, ngModelCtrl) {
            var el_container = angular.element(element.find('div'));
            var el_label     = angular.element(element.find('label'));
            var el_input     = angular.element(element.find('input'));
            el_label.text(attrs.placeholder);
            el_input.attr('placeholder',attrs.placeholder);

            ngModelCtrl.$formatters.push(function(modelValue) {
                return modelValue || '';
            });

            ngModelCtrl.$render = function() {
                scope.val = ngModelCtrl.$viewValue;
                el_container.toggleClass('showLabel', !ngModelCtrl.$isEmpty(scope.val));
            }

            scope.$watch('val', function() {
                ngModelCtrl.$setViewValue(scope.val);
                ngModelCtrl.$render();
            });
            
            scope.$watch('disabled', function() {
                el_input.prop('disabled', scope.disabled);
            });

            scope.$watch('list', function() {
                el_input.prop('ng-list', scope.list);
                el_input.prop('ng-trim', scope.list);
            });

            ngModelCtrl.$parsers.push(function(viewValue) {
                return viewValue || '';
            });

            el_container.click(function() {
                el_input.focus();
            });
            
            el_input.focus(function() {
                el_container.addClass('active');
            });

            el_input.blur(function() {
                el_container.removeClass('active');
            });
        }
    };
}

function bkTextarea() {
    return {
        restrict: 'E',
        template:
            '<div class="brooklyn brooklyn-textarea">' +
            '<label></label>' +
            '<textarea ng-model="val" ng-trim="false"></textarea>' +
            '</div>',
        require: 'ngModel',
        scope: {
            disabled: '=ngDisabled'
        },
        link: function(scope, element, attrs, ngModelCtrl) {
            var el_container = angular.element(element.find('div'));
            var el_label     = angular.element(element.find('label'));
            var el_textarea  = angular.element(element.find('textarea'));
            el_label.text(attrs.placeholder);
            el_textarea.attr('placeholder',attrs.placeholder);

            ngModelCtrl.$formatters.push(function(modelValue) {
                return modelValue || '';
            });

            ngModelCtrl.$render = function() {
                scope.val = ngModelCtrl.$viewValue;
                el_container.toggleClass('showLabel', !ngModelCtrl.$isEmpty(scope.val));
                
                //console.log(scope.val.length + '  ##  ' +scope.val.split('\n').length);
                //var n_spaces = (scope.val.match(/[\n\r]/g)||[]).length;
                //el_textarea.css('height',(45 + (n_spaces * 20)) + 'px');
            }

            scope.$watch('val', function() {
                ngModelCtrl.$setViewValue(scope.val);
                ngModelCtrl.$render();
            });

            scope.$watch('disabled', function() {
                el_textarea.prop('disabled', scope.disabled);
            });

            ngModelCtrl.$parsers.push(function(viewValue) {
                return viewValue || '';
            });

            el_container.click(function() {
                el_textarea.focus();
            });
            
            el_textarea.focus(function() {
                el_container.addClass('active');
            });

            el_textarea.blur(function() {
                el_container.removeClass('active');
            });
        }
    }
}

function bkRadio() {
    return {
        restrict: 'E',
        template:
            '<div class="brooklyn brooklyn-checkbox">' +
            '<button class="btn" ng-click="val = value">' +
            '<label>{{ label }}</label>' +
            '<i class="glyphicon"></i>' +
            '<span>{{ caption }}</span>' +
            '</button>' +
            '</div>',
        require: 'ngModel',
        scope: {
            caption: '@',
            value: '@',
            disabled: '=ngDisabled',
            label: '@'
        },
        link: function(scope, element, attrs, ngModelCtrl) {
            var container  = angular.element(element.find('div'));
            var button = angular.element(element.find('button')[0]);
            var icon = angular.element(element.find('i'));

            if(scope.caption == undefined) {
                scope.caption = '&nbsp;';
            }

            ngModelCtrl.$formatters.push(function(modelValue) {
                return modelValue;
            });

            ngModelCtrl.$render = function() {
                scope.val = ngModelCtrl.$viewValue;
                var on = (scope.val == scope.value);
                icon.toggleClass('glyphicon-check',on);
                icon.toggleClass('glyphicon-unchecked',!on);
                button.toggleClass('btn-primary',on);
                button.toggleClass('btn-default',!on);
                container.toggleClass('showLabel',scope.label !== undefined);
            }

            scope.$watch('val', function() {
                ngModelCtrl.$setViewValue(scope.val);
                ngModelCtrl.$render();
            });

            scope.$watch('disabled', function() {
                button.prop('disabled', scope.disabled);
            });

            ngModelCtrl.$parsers.push(function(viewValue) {
                return viewValue;
            });
        }
    };
}

function bkCheckbox() {
    return {
        restrict: 'E',
        template:
            '<div class="brooklyn brooklyn-checkbox showLabel">' +
            '<button class="btn" ng-click="val = !val">' +
            '<label>{{ label }}</label>' +
            '<i class="glyphicon"></i>' +
            '<span>{{ caption }}</span>' +
            '</button>' +
            '</div>',
        require: 'ngModel',
        scope: {
            caption: '@',
            disabled: '=ngDisabled',
            label: '@'
        },
        link: function(scope, element, attrs, ngModelCtrl) {
            var container  = angular.element(element.find('div'));
            var button = angular.element(element.find('button')[0]);
            var icon = angular.element(element.find('i'));
            var label = angular.element(element.find('label'));

            if(scope.caption == undefined) {
                scope.caption = '&nbsp;';
            }

            ngModelCtrl.$formatters.push(function(modelValue) {
                return !!modelValue;
            });

            ngModelCtrl.$render = function() {
                scope.val = ngModelCtrl.$viewValue;
                icon.toggleClass('glyphicon-check',scope.val);
                icon.toggleClass('glyphicon-unchecked',!scope.val);
                button.toggleClass('btn-primary',scope.val);
                button.toggleClass('btn-default',!scope.val);
                container.toggleClass('showLabel',scope.label !== undefined);
            }

            scope.$watch('val', function() {
                ngModelCtrl.$setViewValue(scope.val);
                ngModelCtrl.$render();
            });

            scope.$watch('disabled', function() {
                button.prop('disabled', scope.disabled);
            });

            ngModelCtrl.$parsers.push(function(viewValue) {
                return viewValue;
            });
        }
    };
}

angular.module('brooklyn-ui', [])
.directive('bkSelectbox',bkSelectbox)
.directive('bkTextbox',bkTextbox)
.directive('bkTextarea',bkTextarea)
.directive('bkRadio',bkRadio)
.directive('bkCheckbox',bkCheckbox);

