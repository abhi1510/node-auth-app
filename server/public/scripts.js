var app = angular.module('myApp', ["ngRoute"]);

app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "views/home.html",
        controller  : 'mainController'
    })
    .when("/register", {
        templateUrl : "views/register.html",
        controller  : 'registerController'
    })
    .when("/login", {
        templateUrl : "views/login.html",
        controller  : 'loginController'
    })
});

app.controller('mainController', function($scope, $location, userData) {
    $scope.message = 'Main Controller';
    console.log(userData.getUser());
    if(_.isEmpty(userData.getUser())) {        
        $location.path('/login');
    } else {
        $location.path('/');        
    }
});

app.controller('registerController', function($scope, $http, $location, userData) {
    $scope.message = 'Register Controller';

    $scope.user = {};

    $scope.registerUser = function() {
        $http({
            url: '/users',
            method: "POST",
            data: JSON.stringify($scope.user),
            headers: {'Content-Type': 'application/json'}
        }).success(function (data, status, headers, config) {
            userData.setUser(data._id, data.email, headers()['x-auth']);
            $location.path('/')           
        }).error(function (data, status, headers, config) {
            var err_name = data.name;
            var code = data.code;            
            console.log('Error', err_name, code);
        });
    }    
});

app.controller('loginController', function($scope, $http, $location, userData) {
    $scope.message = 'Login Controller';

    $scope.user = {};

    $scope.loginUser = function() {
        $http({
            url: '/users/login',
            method: "POST",
            data: JSON.stringify($scope.user),
            headers: {'Content-Type': 'application/json'}
        }).success(function (data, status, headers, config) {
            userData.setUser(data._id, data.email, headers()['x-auth']); 
            $location.path('/')           
        }).error(function (data, status, headers, config) {
            var err_name = data.name;
            var code = data.code;            
            console.log('Error', err_name, code);
        });
    }
});

app.service('userData', function() {

    this.user = {};

    this.setUser = function(userId, email, token) {
        this.user = {
            userId: userId,
            email: email,
            token: token
        }
    }

    this.getUser = function (x) {
        return this.user;
    }
});

