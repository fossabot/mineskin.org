mineskinApp.controller("galleryController", ["$scope", "$stateParams", "$http", "$cookies", "$window", "$state", "$timeout", "$sce", "ngMeta", "$localStorage", function ($scope, $stateParams, $http, $cookies, $window, $state, $timeout, $sce, ngMeta, $localStorage) {
    console.info("galleryController")

    window.__scope = $scope;

    $scope.materializeInit('tab2');

    $scope.$storage = $localStorage;

    // To keep track of reloads (new-loads), since the pagination seems to reset the route-param back to its default value
    var newLoad = true;

    $scope.searchQuery = $stateParams.query || "";
    $scope.searchTimeout = null;
    $scope.searchChanged = function () {
        if ($scope.searchTimeout) {
            $timeout.cancel($scope.searchTimeout);
        }
        $scope.searchTimeout = $timeout(function () {
            $state.transitionTo('gallery', {page: 1, query: $scope.searchQuery}, {notify: false});
            $scope.reloadGallery();
        }, 500);
    };
    $scope.viewMode = parseInt($cookies.get("viewMode") || 0);// 0 = heads only; 1 = full skins; 2 = own skins
    $scope.resultType = $cookies.get("resultType");
    if ($scope.resultType == undefined) {
        $scope.resultType = "list";
    }
    $scope.toggleViewMode = function () {
        $scope.viewMode = 1 - $scope.viewMode;// Toggle 1/0

        if ($scope.viewMode === 1) {
            $scope.pagination.itemsPerPage = 12;
        } else {
            $scope.pagination.itemsPerPage = 32;
        }

        let now = new $window.Date();
        let expires = new $window.Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        $cookies.put("viewMode", $scope.viewMode, {
            expires: expires
        });

        $state.reload();
    };
    $scope.toggleOwnSkins = function () {
        $scope.viewMode = $scope.viewMode >= 2 ? 0 : 2;

        let now = new $window.Date();
        let expires = new $window.Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        $cookies.put("viewMode", $scope.viewMode, {
            expires: expires
        });

        if ($scope.viewMode === 2) {
            $scope.loadOwnSkins();
            $state.reload();
        }
    }

    $scope.ownSkins = $scope.$storage.recentSkins || [];
    $scope.loadOwnSkins = function () {
        $scope.ownSkins = $scope.$storage.recentSkins || [];
        $scope.checkAccount(function (account) {
            if (!account) {
                return;
            }
            $http({
                method: 'GET',
                url: apiBaseUrl + '/account/skins',
                withCredentials: true,
            }).then(function (res) {
                for (let s of res.data) {
                    if (!$scope.ownSkins.includes(s)) {
                        $scope.ownSkins.unshift(s);
                    }
                }
            });
        })
    };

    if ($scope.viewMode === 2) { // already looking at own skins -> load them
        $scope.loadOwnSkins();
    } else { // check if logged in, then load
        $scope.checkAccount(function (account) {
            if (!account) {
                return;
            }
            $scope.loadOwnSkins();
        })
    }

    $scope.resultTypeChanged = function () {
        var now = new $window.Date();
        var expires = new $window.Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        $cookies.put("resultType", $scope.resultType, {
            expires: expires
        });

        $state.reload();
    };

    $scope.pagination = {
        page: 0,
        pages: 0,
        totalItems: 0,
        itemsPerPage: $scope.viewMode === 1 ? 12 : 32,
        maxSize: 4,
        lastSize: 32,
        nextAnchor: 'start',
    };
    $scope.loading = true;
    $scope.skins = [];
    $scope.loadMore = function () {
        $scope.pagination.page++;
        if ($scope.pagination.lastSize < $scope.pagination.itemsPerPage) return; // probably no more results
        $scope.loading = true;
        console.log("load more " + $scope.pagination.page + " (" + $scope.pagination.nextAnchor + ")");
        $http({
            url: apiBaseUrl + "/get/" + $scope.resultType + "/" + $scope.pagination.nextAnchor + "?size=" + $scope.pagination.itemsPerPage + ($scope.searchQuery ? "&filter=" + $scope.searchQuery : ""),
            method: "GET"
        }).then(function (response) {
            console.log(response);
            $timeout(function () {
                $scope.loading = false;
                $scope.skins = [...$scope.skins, ...response.data.skins];
                if ($scope.skins.length === 0) {
                    $scope.skins.push({
                        id: 404,
                        uuid: "40404040404040404040404040404040",
                        time: 1081051444,
                        url: "http://textures.minecraft.net/texture/556b851d728a546fa8111d08519052d1e1d8fd9fa38d592d7346c895fee21933"
                    });
                }
                $scope.pagination.lastSize = response.data.skins.length;
                if (response.data.skins.length > 0) {
                    $scope.pagination.nextAnchor = response.data.skins[response.data.skins.length - 1].uuid;
                }
                // $scope.pagination.page = response.data.page.index;
                // $scope.pagination.pages = response.data.page.amount;
                // $scope.pagination.totalItems = response.data.page.total;
                newLoad = false;
            });

            setTimeout(function () {
                // preload next page
                $http({
                    url: apiBaseUrl + "/get/" + $scope.resultType + "/" + $scope.pagination.nextAnchor + "?size=" + $scope.pagination.itemsPerPage + ($scope.searchQuery ? "&filter=" + $scope.searchQuery : ""),
                    method: "GET"
                }).then(function (resp) {
                    let x = 1;
                    for (let s of resp.data.skins) {
                        setTimeout(function () {
                            const img = document.createElement('img');
                            img.style.display = 'none';
                            img.setAttribute('src', apiBaseUrl + "/render/" + ($scope.viewMode == 0 ? 'head' : 'skin') + "?url=" + s.url + "&skinName=" + (s.name || ''));
                            img.onload = function () {
                                setTimeout(function () {
                                    img.remove();
                                }, 10000);
                            };
                            document.body.append(img);
                        }, 100 * (x++) + 1000 * Math.random());
                    }
                })
            }, 5)
        });
    };
    $scope.reloadGallery = function () {
        console.log("reload gallery");
        $scope.skins = [];
        $scope.pagination.page = 0;
        $scope.loadMore();
    };
    $scope.galleryInit = function () {
        // Set page after init, so the pagination gets updated
        $scope.pagination.page = $stateParams.page;
        $scope.reloadGallery();
    };

    $scope.pageChanged = function (page) {
        $scope.pagination.page = page;
        $state.go('gallery', {page: $scope.pagination.page}, {notify: false});
    };
    $scope.getLastSkinCookie = function () {
        var id = $cookies.get("lastSkinId");
        if (!id) {
            var now = new $window.Date();
            var expires = new $window.Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

            $cookies.put("lastSkinId", "0", {
                expires: expires
            });
            return 0;
        }
        return id;
    };
}]);
