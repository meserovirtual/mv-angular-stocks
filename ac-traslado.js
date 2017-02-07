(function () {

    'use strict';


    angular.module('acTraslado', [])
        .component('acTraslado', acTraslado());

    function acTraslado() {
        return {
            bindings: {},
            templateUrl: window.installPath + '/ac-angular-stocks/ac-traslado.html',
            controller: acTrasladoController
        }
    }

    acTrasladoController.$inject = ["$rootScope", "$location", 'ProductService', 'SucursalesService', 'MvUtilsGlobals',
        'ProductVars', 'StockService', 'StockVars', 'MvUtils'];
    function acTrasladoController($rootScope, $location, ProductService, SucursalesService, MvUtilsGlobals,
                                  ProductVars, StockService, StockVars, MvUtils) {
        var vm = this;
        vm.producto = {};
        vm.sucursales = [];
        vm.sucursal_origen = {};
        vm.sucursal_destino = {};
        vm.cantidad_disponible = 0;
        vm.detalles = [];
        vm.detalle = {};
        vm.clear = true;


        vm.add = add;
        vm.save = save;
        vm.removeDetalle = removeDetalle;
        vm.calc_disponible = calc_disponible;
        vm.controlarCantidad = controlarCantidad;

        StockVars.clearCache = true;


        SucursalesService.get().then(function (data) {
            vm.sucursales = data;
        });


        document.getElementById('searchProducto').getElementsByTagName('input')[0].addEventListener('blur', function (event) {
            calc_disponible();
        });

        function controlarCantidad() {
            if (vm.cantidad > vm.cantidad_disponible) {
                MvUtils.showMessage('error', 'La cantidad seleccionada es mayor a la disponible');
                vm.cantidad = vm.cantidad_disponible;
            }
        }

        function calc_disponible() {

            //console.log(vm.producto);
            if (vm.producto.stocks == undefined) {
                return;
            }
            vm.cantidad_disponible = 0;
            for (var i = 0; i < vm.producto.stocks.length; i++) {
                if (vm.producto.stocks[i].sucursal_id == vm.sucursal_origen.sucursal_id) {
                    vm.cantidad_disponible = vm.producto.stocks[i].cant_actual + vm.cantidad_disponible;
                }

            }
        }

        function removeDetalle(detalle) {
            var n = vm.detalles.indexOf(detalle);
            vm.detalles.splice(n, 1);
        }

        function add() {
            if (vm.sucursal_origen.sucursal_id == undefined) {
                MvUtils.showMessage('error', 'Debe seleccionar una sucursal de origen');
                return;
            }
            if (vm.sucursal_destino.sucursal_id == undefined) {
                MvUtils.showMessage('error', 'Debe seleccionar una sucursal de destino');
                return;
            }
            if (vm.producto.producto_id == undefined) {
                MvUtils.showMessage('error', 'Debe seleccionar un producto');
                return;
            }
            if (vm.cantidad == undefined || vm.cantidad == 0) {
                MvUtils.showMessage('error', 'Debe ingresar una cantidad');
                return;
            }
            if (vm.sucursal_destino == vm.sucursal_origen) {
                MvUtils.showMessage('error', 'Las sucursales no pueden se las mismas');
                return;
            }


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
                origen_id: vm.sucursal_origen.sucursal_id,
                origen_nombre: vm.sucursal_origen.nombre,
                destino_id: vm.sucursal_destino.sucursal_id,
                destino_nombre: vm.sucursal_destino.nombre,
                producto_id: vm.producto.producto_id,
                nombre: vm.producto.nombre,
                cantidad: vm.cantidad
            };

            vm.detalles.push(vm.detalle);
            vm.detalle = {};

        }

        function save() {

            StockService.trasladar(vm.detalles).then(function (data) {
                ProductVars.clearCache = true;
                StockService.get();
                MvUtils.showMessage('success', 'Traslado realizado con éxito');
                $location.path('/caja/cobros');
            });


        }

        vm.searchProducto = searchProducto;

        function searchProducto(callback) {
            MvUtilsGlobals.sucursal_id_search = vm.sucursal_origen.sucursal_id;
            StockService.get().then(callback).then(function () {
                MvUtilsGlobals.sucursal_id_search = 0;
            });
        }


    }


})();

