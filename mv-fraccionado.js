(function () {
    'use strict';

    angular.module('mvFraccionado', [])
        .component('mvFraccionado', mvFraccionado());

    function mvFraccionado() {
        return {
            bindings: {},
            templateUrl: window.installPath + '/mv-angular-stocks/mv-fraccionado.html',
            controller: FraccionadoController
        }
    }

    FraccionadoController.$inject = ["$scope", "$location", "MovimientosService",
        'StockService', 'ProductService', 'StockVars'];
    function FraccionadoController($scope, $location, MovimientosService,
                                   StockService, ProductService, StockVars) {
        var vm = this;
        // Productos tipo 4 para fraccionar que tengan stock mayor a 0
        vm.productos_a_fraccionar = [];
        vm.producto_a_fraccionar = {};
        // Productos que se generan a partir del fraccionado, es el resultado luego de fraccionar
        vm.productos = [];
        vm.producto = {};
        vm.searchProductText = '';
        vm.searchProductTextAFraccionar = '';
        vm.cant_esperada = 0;
        vm.cant_obtenida = 0;
        vm.completo = false;
        vm.costo_uni = (vm.producto_a_fraccionar.costo_uni * vm.producto_a_fraccionar.cant_inicial) / vm.cant_esperada;

        vm.save = save;


        function save() {
            var detalles = [];
            var detalle = {};

            if (vm.producto.producto_id == undefined || vm.producto_a_fraccionar.producto_id == undefined) {
                return
            }

            var producto_a_fraccionar = {
                producto_tipo: 4,
                precio_unidad: vm.producto_a_fraccionar.costo_uni,
                producto_id: vm.producto_a_fraccionar.producto_id,
                cantidad: vm.producto_a_fraccionar.cant_inicial,
                proveedor_id: vm.producto_a_fraccionar.proveedor_id
            };
            var producto_fraccionado = {
                producto_tipo: vm.producto.producto_tipo,
                precio_unidad: (vm.producto_a_fraccionar.costo_uni * vm.producto_a_fraccionar.cant_inicial) / vm.cant_esperada,
                producto_id: vm.producto.producto_id,
                cantidad: vm.cant_obtenida,
                proveedor_id: vm.producto_a_fraccionar.proveedor_id
            };
            var desperdicio = {
                producto_tipo: -1,
                precio_unidad: (vm.producto_a_fraccionar.costo_uni * vm.producto_a_fraccionar.cant_inicial) / vm.cant_esperada,
                producto_id: vm.producto.producto_id,
                cantidad: vm.cant_esperada - vm.cant_obtenida,
                proveedor_id: vm.producto_a_fraccionar.proveedor_id
            };

            var items = [];
            items.push(producto_a_fraccionar);
            items.push(producto_fraccionado);
            items.push(desperdicio);


            detalle = {};
            detalle.producto_id = vm.producto.producto_id;
            detalle.proveedor_id = vm.producto_a_fraccionar.proveedor_id;
            //detalle.sucursal_id = vm.pedido.sucursal_id;
            detalle.sucursal_id = 1;
            detalle.cant_inicial = vm.cant_obtenida;
            detalle.cant_actual = vm.cant_obtenida;
            detalle.precio_unidad = (vm.producto_a_fraccionar.costo_uni * vm.producto_a_fraccionar.cant_inicial) / vm.cant_esperada;
            detalles.push(detalle);

            vm.forma_pago = '-01';


            //console.log(vm.producto_a_fraccionar.stock_id);
            //console.log(detalles);
            //console.log(items);

            //(tipo_asiento, subtipo_asiento, sucursal_id, forma_pago, transferencia_desde, total, descuento, detalle, items, cliente_id, usuario_id, comentario, callback)
            MovimientosService.armarMovimiento('016', '', MvUtilsGlobals.sucursal_id, MvUtilsGlobals.pos_id, vm.forma_pago, '', (vm.producto_a_fraccionar.costo_uni * vm.producto_a_fraccionar.cant_inicial), '', 'Fraccionado de producto', items, vm.producto_a_fraccionar.proveedor_id, 1, 'Fraccionado de producto', function (data) {
                StockService.create(detalles, function (data) {

                    if (!vm.completo) {
                        StockVars.clearCache = true;
                        StockService.get(function (data) {
                        });
                        toastr.success('Fraccionado realizado');
                        $location.path('/cajas/0');
                    } else {

                        StockService.update({
                            stock_id: vm.producto_a_fraccionar.stock_id,
                            cant_actual: 0
                        }, function (data) {
                            StockVars.clearCache = true;
                            StockService.get(function (data) {
                            });
                            toastr.success('Fraccionado realizado');
                            $location.path('/cajas/0');
                        });
                    }
                });
            });
        }

        vm.searchProducto = searchProducto;
        vm.searchProductoFraccionable = searchProductoFraccionable;

        function searchProducto(callback) {
            StockService.get().then(callback);
        }

        function searchProductoFraccionable(callback) {
            StockService.getFraccionables().then(callback);
        }
    }


})();

