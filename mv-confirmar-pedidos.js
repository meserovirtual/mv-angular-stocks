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


    MvPedidosController.$inject = ['PedidoService', '$location', 'PedidoVars', 'MvUtils'];
    function MvPedidosController(PedidoService, $location, PedidoVars, MvUtils) {

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
                PedidoService.get().then(function (data) {
                    vm.pedidos = data;
                    vm.paginas = PedidoVars.paginas;
                    console.log(vm.pedidos);
                }).catch(function(error){
                    console.log(error);
                });
            } else {
                PedidoVars.all = true;
                PedidoService.get().then(function (data) {
                    vm.pedidos = data;
                    vm.paginas = PedidoVars.paginas;
                    console.log(vm.pedidos);
                }).catch(function(error){
                    console.log(error);
                });
            }
        }

        // Implementación de la paginación
        vm.start = 0;
        vm.limit = PedidoVars.paginacion;
        vm.pagina = PedidoVars.pagina;
        vm.paginas = PedidoVars.paginas;

        function paginar(vars) {
            if (vars == {}) {
                return;
            }
            vm.start = vars.start;
            vm.pagina = vars.pagina;
        }

        vm.next = function () {
            paginar(MvUtils.next(PedidoVars));
        };
        vm.prev = function () {
            paginar(MvUtils.prev(PedidoVars));
        };
        vm.first = function () {
            paginar(MvUtils.first(PedidoVars));
        };
        vm.last = function () {
            paginar(MvUtils.last(PedidoVars));
        };

        vm.goToPagina = function () {
            paginar(MvUtils.goToPagina(vm.pagina, PedidoVars));
        }


    }


})();