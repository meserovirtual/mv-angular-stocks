(function () {
    'use strict';

    angular.module('mvConfirmarPedidos', ['ngRoute'])
        .component('mvConfirmarPedidos', mvConfirmarPedidos());

    function mvConfirmarPedidos() {
        return {
            bindings: {
                searchFunction: '&'
            },
            templateUrl: window.installPath + '/mv-angular-stocks/mv-confirmar-pedidos.html',
            controller: MvPedidosController
        }
    }


    MvPedidosController.$inject = ['PedidoService', '$location', 'PedidoVars'];
    function MvPedidosController(PedidoService, $location, PedidoVars) {

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