mineskinApp.controller("accountController", ["$scope", "$http", "$cookies", "$timeout", "$stateParams", "$sce", "ngMeta", "$window", function ($scope, $http, $cookies, $timeout, $stateParams, $sce, ngMeta, $window) {
    console.info("accountController")

    $scope.loadLogin = function () {
        console.log('loadLogin')
        google.accounts.id.renderButton(document.getElementById('google_button_placeholder'), {
            locale: 'en',
            logo_alignment: 'left',
            shape: 'pill',
            size: 'large',
            text: 'continue_with',
            theme: 'filled_blue',
            type: 'standard'
        });
        $scope.checkAccount(function (account){
            if(!account) return;
        })
        // google.accounts.id.prompt();
        // googleInit().then(()=>{
        //     google.accounts.id.renderButton(document.getElementById('google_button_placeholder'), {
        //         locale: 'en',
        //         logo_alignment: 'left',
        //         shape: 'pill',
        //         size: 'large',
        //         text: 'continue_with',
        //         theme: 'filled_blue',
        //         type: 'standard'
        //     });
        //     google.accounts.id.prompt();
        // })
    }


    /// UTIL

    $scope.handleResponseError = function (response) {
        if (response.data) {
            console.warn(response.data);
            Materialize.toast("Error: " + (response.data.msg || response.data.error));
            if ((response.data.msg || response.data.error)?.includes("invalid session")) {
                $timeout(function () {
                    $scope.logout();
                }, 5000);
            }
        } else {
            console.warn(response.data);
        }
    }

}])

