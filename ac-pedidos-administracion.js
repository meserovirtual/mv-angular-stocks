(function () {
    'use strict';

    angular.module('acPedidosAdministracion', ['ngRoute'])


        .component('acPedidosAdministracion', acPedidosAdministracion());


    function acPedidosAdministracion() {
        return {
            bindings: {
                searchFunction: '&'
            },
            templateUrl: window.installPath + '/ac-angular-stocks/ac-pedidos-administracion.html',
            controller: AcPedidosController
        }
    }


    AcPedidosController.$inject = ['PedidoService', '$location', 'PedidoVars'];
    function AcPedidosController(PedidoService, $location, PedidoVars) {

        var vm = this;

        vm.pedidos = [];
        vm.detalle = detalle;
        vm.soloActivos = true;
        vm.loadPedidos = loadPedidos;
        vm.pedido = {};

        loadPedidos();


        function detalle(id) {
            $location.path('/pedidos/' + id);
        }


        function loadPedidos() {
            if (vm.soloActivos) {
                PedidoVars.all = false;
                PedidoService.get(
                    function (data) {
                        vm.pedidos = data;
                        //console.log(vm.pedidos);
                    }
                );
            } else {

                PedidoVars.all = true;
                PedidoService.get(
                    function (data) {
                        vm.pedidos = data;
                        //console.log(vm.pedidos);
                    }
                );
            }
        }


    }


})();