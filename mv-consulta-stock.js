(function () {
    'use strict';

    angular.module('nombreapp.stock.consultaStock', ['ngRoute', 'toastr'])

        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.when('/consulta_stock', {
                templateUrl: './consulta_stock/consulta_stock.html',
                controller: 'ConsultaStockController',
                data: {requiresLogin: true}
            });
        }])

        .controller('ConsultaStockController', ConsultaStockController)
        .service('ConsultaStockService', ConsultaStockService);


    ConsultaStockController.$inject = ['StockVars', 'StockService', 'toastr', 'SucursalesService'];
    function ConsultaStockController(StockVars, StockService, toastr, SucursalesService) {

        var vm = this;

        vm.stocks = [];
        vm.todos = [];
        vm.sucursales = [];
        vm.sucursal = {};
        vm.conStock = true;
        vm.filtroSucursal = filtroSucursal;
        vm.loadConStock = loadConStock;
        StockVars.sucursal_id = -1;


        SucursalesService.get(function (data) {


            vm.sucursales = data;
            vm.sucursales.push({sucursal_id: -1, nombre: "Todas", direccion: "", telefono: ""});
            vm.sucursal = vm.sucursales[vm.sucursales.length - 1];

            StockVars.reducido = true;
            StockVars.clearCache = true;
            StockVars.sucursal_id = -1;
            StockService.get(function (data) {
                vm.stocks = data;
            });

        });


        function loadConStock() {


            if (vm.conStock) {
                StockVars.clearCache = true;
                StockVars.reducido = true;
                StockService.get(function (data) {
                    vm.stocks = data;
                });
            } else {
                StockVars.clearCache = true;
                StockVars.reducido = false;
                StockService.get(function (data) {
                    vm.stocks = data;
                });
            }


        }

        function filtroSucursal() {

            if (vm.sucursal.sucursal_id !== -1) {
                var results = vm.todos.filter(function (elem, index, array) {
                    return elem.sucursal_id == vm.sucursal.sucursal_id;
                });

                vm.stocks = results;
            } else {
                vm.stocks = vm.todos;
            }

        }
    }

    ConsultaStockService.$inject = ['$http'];
    function ConsultaStockService($http) {
        var url = './stock-api/stock.php';
        var service = {};

        service.getStock = getStock;
        service.getConStock = getConStock;
        service.updateStock = updateStock;

        return service;

        function getStock(callback) {
            $http.post(url,
                {function: 'getStock'},
                {cache: true})
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                });
        }

        function getConStock(callback) {
            getStock(function (data) {
                var response = data.filter(function (elem, index, array) {

                    //console.log(elem.cant_actual > 0);
                    return elem.cant_actual > 0;

                });

                callback(response);
            });
        }

        function updateStock(stock, callback) {
            //console.log(stock);
            $http.post(url,
                {function: 'updateStock', stock: JSON.stringify(stock)},
                {cache: true})
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                });
        }

    }

})();