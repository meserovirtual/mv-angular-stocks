(function () {

    'use strict';


    angular.module('nombreapp.stock.trasladarStock', ['ngRoute', 'toastr', 'acMovimientos'])

        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.when('/trasladar_stock', {
                templateUrl: './trasladar_stock/trasladar_stock.html',
                controller: 'TrasladarStockController',
                data: {requiresLogin: true}
            });
        }])

        .controller('TrasladarStockController', TrasladarStockController)
        .factory('TrasladarStockService', TrasladarStockService);

    TrasladarStockController.$inject = ["$rootScope", "$location", 'ProductService', 'SucursalesService', 'TrasladarStockService', 'AcUtilsGlobals',
        'toastr', 'ProductVars', 'StockService', 'StockVars'];
    function TrasladarStockController($rootScope, $location, ProductService, SucursalesService, TrasladarStockService, AcUtilsGlobals,
                                      toastr, ProductVars, StockService, StockVars) {
        var vm = this;
        vm.producto = {};
        vm.sucursales = [];
        vm.origen_id = 0;
        vm.destino_id = 0;
        vm.cantidad_disponible = 0;
        vm.detalles = [];
        vm.detalle = {};
        vm.add = add;
        vm.save = save;
        vm.removeDetalle = removeDetalle;
        vm.calc_disponible = calc_disponible;
        vm.setSucursalOrigen = setSucursalOrigen;
        vm.controlarCantidad = controlarCantidad;
        StockVars.sucursal_id = -1;

        SucursalesService.get(function (data) {
            vm.sucursales = data;
            //vm.sucursales_destino = data;

        });

        function controlarCantidad() {
            if (vm.cantidad > vm.cantidad_disponible) {
                toastr.error('La cantidad seleccionada es mayor a la disponible');
                vm.cantidad = vm.cantidad_disponible;
            }
        }

        function setSucursalOrigen() {
            AcUtilsGlobals.sucursal_auxiliar_id = vm.origen_id;
            //console.log(AcUtilsGlobals.sucursal_auxiliar_id);
        }

        // Esto es un listener de la directiva search-panel
        AcUtilsGlobals.listenPanel(calc_disponible);

        function calc_disponible() {
            //console.log(vm.producto);
            if (vm.producto.stock == undefined) {
                return;
            }
            vm.cantidad_disponible = 0;
            for (var i = 0; i < vm.producto.stock.length; i++) {
                if (vm.producto.stock[i].sucursal_id == AcUtilsGlobals.sucursal_auxiliar_id) {
                    vm.cantidad_disponible = vm.producto.stock[i].cant_actual + vm.cantidad_disponible;
                }

            }
        }

        function removeDetalle(detalle) {
            var n = vm.detalles.indexOf(detalle);
            vm.detalles.splice(n, 1);
        }

        function add() {
            var origen_nombre = '';
            var destino_nombre = '';
            for (var i = 0; i < vm.sucursales.length; i++) {
                if (vm.origen_id == vm.sucursales[i].sucursal_id) {
                    origen_nombre = vm.sucursales[i].nombre;
                }
            }
            for (var i = 0; i < vm.sucursales.length; i++) {
                if (vm.destino_id == vm.sucursales[i].sucursal_id) {
                    destino_nombre = vm.sucursales[i].nombre;
                }
            }

            vm.detalle = {
                origen_id: vm.origen_id,
                origen_nombre: origen_nombre,
                destino_id: vm.destino_id,
                destino_nombre: destino_nombre,
                producto_id: vm.producto.producto_id,
                nombre: vm.producto.nombreProducto,
                cantidad: vm.cantidad
            };

            vm.detalles.push(vm.detalle);
            vm.detalle = {};

        }

        function save() {
            AcUtilsGlobals.isWaiting = true;
            $rootScope.$broadcast('IsWaiting');
            //if (vm.destino_id == vm.origen_id) {
            //    toastr.error('La sucursal de origen y destino no pueden ser las mismas');
            //    return;
            //}

            for (var i = 0; i < vm.detalles.length; i++) {
                StockService.trasladar(vm.detalles[i].origen_id, vm.detalles[i].destino_id, vm.detalles[i].producto_id, vm.detalles[i].cantidad, function (data) {
                    //console.log(data);


                    //}

                });

            }

            ProductVars.clearCache = true;
            ProductService.get(function (data) {
            });
            //console.log(data);
            //if (data == ' ') {
            toastr.success('Traslado realizado con éxito');
            //vm.producto = {};
            //vm.origen_id = 0;
            //vm.destino_id = 0;
            //vm.cantidad_disponible = 0;
            $location.path('/consulta_stock');
            AcUtilsGlobals.isWaiting = false;
            $rootScope.$broadcast('IsWaiting');

            //TrasladarStockService.save()
        }


    }


    TrasladarStockService.$inject = ['$http'];
    function TrasladarStockService($http) {
        var service = {};
        var url = './stock-api/stock.php';
        service.save = save;

        return service;


        function save(origen_id, destino_id, producto_id, cantidad, callback) {

            //console.log(origen_id);
            //console.log(destino_id);
            return $http.post(url,
                {
                    function: 'trasladar',
                    origen_id: origen_id,
                    destino_id: destino_id,
                    producto_id: producto_id,
                    cantidad: cantidad
                })
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                });
        }

    }

})();

