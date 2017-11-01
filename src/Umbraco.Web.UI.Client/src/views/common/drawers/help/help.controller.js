(function () {
    "use strict";

    function HelpDrawerController($scope, $routeParams, $timeout, dashboardResource, localizationService, userService, eventsService, helpService, appState, tourService, $filter) {

        var vm = this;
        var evts = [];

        vm.title = localizationService.localize("general_help");
        vm.subtitle = "Umbraco version" + " " + Umbraco.Sys.ServerVariables.application.version;
        vm.section = $routeParams.section;
        vm.tree = $routeParams.tree;
        vm.sectionName = "";
        vm.customDashboard = null;
        vm.tours = [];

        vm.closeDrawer = closeDrawer;
        vm.startTour = startTour;
        vm.getTourGroupCompletedPercentage = getTourGroupCompletedPercentage;
        vm.showTourButton = showTourButton;
            
        function startTour(tour) {
            tourService.startTour(tour);
            closeDrawer();
        }

        function oninit() {

            tourService.getGroupedTours().then(function(groupedTours) {
                vm.tours = groupedTours;
            });

            // load custom help dashboard
            dashboardResource.getDashboard("user-help").then(function (dashboard) {
                vm.customDashboard = dashboard;
            });

            if (!vm.section) {
                vm.section = "content";
            }

            setSectionName();

            userService.getCurrentUser().then(function (user) {

                vm.userType = user.userType;
                vm.userLang = user.locale;

                evts.push(eventsService.on("appState.treeState.changed", function (e, args) {
                    handleSectionChange();
                }));

                findHelp(vm.section, vm.tree, vm.usertype, vm.userLang);

            });

            getTourGroupCompletedPercentage();
            
            // check if a tour is running - if it is open the matching group
            var currentTour = tourService.getCurrentTour();

            if (currentTour) {
                openTourGroup(currentTour.alias);
            }

        }

        function closeDrawer() {
            appState.setDrawerState("showDrawer", false);
        }

        function handleSectionChange() {
            $timeout(function () {
                if (vm.section !== $routeParams.section || vm.tree !== $routeParams.tree) {
                    
                    vm.section = $routeParams.section;
                    vm.tree = $routeParams.tree;

                    setSectionName();
                    findHelp(vm.section, vm.tree, vm.usertype, vm.userLang);

                }
            });
        }

        function findHelp(section, tree, usertype, userLang) {
            
            helpService.getContextHelpForPage(section, tree).then(function (topics) {
                vm.topics = topics;
            });

            var rq = {};
            rq.section = vm.section;
            rq.usertype = usertype;
            rq.lang = userLang;

            if ($routeParams.url) {
                rq.path = decodeURIComponent($routeParams.url);

                if (rq.path.indexOf(Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath) === 0) {
                    rq.path = rq.path.substring(Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath.length);
                }

                if (rq.path.indexOf(".aspx") > 0) {
                    rq.path = rq.path.substring(0, rq.path.indexOf(".aspx"));
                }

            } else {
                rq.path = rq.section + "/" + $routeParams.tree + "/" + $routeParams.method;
            }

            helpService.findVideos(rq).then(function(videos){
    	        vm.videos = videos;
            });
            
        }

        function setSectionName() {
            // Get section name
            var languageKey = "sections_" + vm.section;
            localizationService.localize(languageKey).then(function (value) {
                vm.sectionName = value;
            });
        }

        function showTourButton(index, tourGroup) {
            if(index !== 0) {
                var prevTour = tourGroup[index - 1];
                if(prevTour.completed) {
                    return true;
                }
            } else {
                return true;
            }
        }

        function openTourGroup(tourAlias) {
            angular.forEach(vm.tours, function (group) {
                angular.forEach(group, function (tour) {
                    if (tour.alias === tourAlias) {
                        group.open = true;
                    }
                });
            });
        }

        function getTourGroupCompletedPercentage() {
            // Finding out, how many tours are completed for the progress circle
            angular.forEach(vm.tours, function(group){
                var completedTours = 0;
                angular.forEach(group, function(tour){
                    if(tour.completed) {
                        completedTours++;
                    }
                });
                group.completedPercentage = Math.round((completedTours/group.length)*100);
            });
        }

        evts.push(eventsService.on("appState.tour.complete", function (event, tour) {
            tourService.getGroupedTours().then(function(groupedTours) {
                vm.tours = groupedTours;
                openTourGroup(tour.alias);
                getTourGroupCompletedPercentage();
            });
        }));
           
        $scope.$on('$destroy', function () {
            for (var e in evts) {
                eventsService.unsubscribe(evts[e]);
            }
        });

        oninit();

    }

    angular.module("umbraco").controller("Umbraco.Drawers.Help", HelpDrawerController);
})();
