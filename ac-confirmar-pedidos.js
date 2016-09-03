(function () {
    'use strict';

    angular.module('acConfirmarPedidos', ['ngRoute'])


        .component('acConfirmarPedidos', acConfirmarPedidos());


    function acConfirmarPedidos() {
        return {
            bindings: {
                searchFunction: '&'
            },
            templateUrl: window.installPath + '/ac-angular-stocks/ac-confirmar-pedidos.html',
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