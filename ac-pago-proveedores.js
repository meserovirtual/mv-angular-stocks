(function () {

    'use strict';


    angular.module('acPagoProveedores', [])

        .component('acPagoProveedores', acPagoProveedores());

    function acPagoProveedores() {
        return {
            bindings: {
                pedido: '='
            },
            templateUrl: window.installPath + '/ac-angular-stocks/ac-pago-proveedores.html',
            controller: PagoProveedoresController
        }
    }

    PagoProveedoresController.$inject = ["$scope", "$routeParams", "$location", "MovimientosService",
        'PedidoService', 'StockService', 'MvUtilsGlobals', 'MvUtils', 'UserService'];
    function PagoProveedoresController($scope, $routeParams, $location, MovimientosService,
                                       PedidoService, StockService, MvUtilsGlobals, MvUtils, UserService) {
        var vm = this;
        vm.comentario = '';
        vm.subtipo = '00';
        vm.forma_pago_01 = '01';
        vm.forma_pago_02 = '01';
        vm.forma_pago_03 = '01';
        vm.parcial_01 = 0.0;
        vm.parcial_02 = 0.0;
        vm.parcial_03 = 0.0;
        vm.proveedores = 0.0;
        vm.save = save;
        vm.id = $routeParams.id;
        vm.pedido = {total: 0};
        vm.pedido.total = (vm.pedido != undefined) ? parseFloat(vm.pedido.total) : 0;
        vm.parcial_01 = (vm.pedido != undefined) ? parseFloat(vm.pedido.total) : 0;

        $scope.$watch('$ctrl.pedido', function () {
            vm.parcial_01 = parseFloat(vm.pedido.total);
        });

        function save() {
            var detalles = [];
            var detalle = {};

            if (vm.pedido.total != vm.parcial_01 + vm.parcial_02 + vm.parcial_03 + vm.proveedores) {
                MvUtils.showMessage('error', 'El monto ingresado debe ser igual al total a pagar');
                return;
            }


            for (var i = 0; i < vm.pedido.pedidos_detalles.length; i++) {
                detalle = {};
                detalle.producto_id = vm.pedido.pedidos_detalles[i].producto_id;
                detalle.proveedor_id = vm.pedido.proveedor_id;
                detalle.sucursal_id = vm.pedido.sucursal_id;
                //detalle.sucursal_id = 1;
                detalle.cant_inicial = vm.pedido.pedidos_detalles[i].cantidad;
                detalle.cant_actual = vm.pedido.pedidos_detalles[i].cantidad;
                detalle.precio_unidad = vm.pedido.pedidos_detalles[i].precio_unidad;

                detalles.push(detalle);
            }

            vm.forma_pago = [
                {forma_pago: vm.forma_pago_01, importe: vm.parcial_01},
                {forma_pago: vm.forma_pago_02, importe: vm.parcial_02},
                {forma_pago: vm.forma_pago_03, importe: vm.parcial_03},
                {forma_pago: '12', importe: vm.proveedores}
            ];


            PedidoService.confirmarPedido(vm.pedido).then(
                function (data) {


                    if (data > 0) {
                        //(tipo_asiento, subtipo_asiento, sucursal_id, forma_pago, transferencia_desde, total, descuento, detalle, items, cliente_id, usuario_id, comentario, callback)
                        MovimientosService.armarMovimiento('002', vm.subtipo, UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, vm.forma_pago, '', vm.pedido.total, '', vm.comentario, vm.pedido, vm.pedido.proveedor_id, 1, vm.comentario, function (data) {


                            vm.comentario = '';
                            vm.subtipo = '00';
                            vm.forma_pago = '01';
                            StockService.create(detalles).then(function (data) {
                                $location.path('/caja/cobros');
                                MvUtils.showMessage('success', 'Pedido Confirmado');
                            });
                        });
                    } else {
                        //toastr.success('Pedido confirmado con éxito.');
                        $location.path('/caja/cobros');
                        MvUtils.showMessage('error', 'Error al confirmar el pedido.');
                    }
                });
        }


    }


})();

