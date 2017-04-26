(function () {
    'use strict';

    angular.module('mvPedidosAdministracion', ['ngRoute'])
        .component('mvPedidosAdministracion', mvPedidosAdministracion())
        .service('PedidoAdminService', PedidoAdminService);


    function mvPedidosAdministracion() {
        return {
            bindings: {
                searchFunction: '&'
            },
            templateUrl: window.installPath + '/mv-angular-stocks/mv-pedidos-administracion.html',
            controller: MvPedidosController
        }
    }


    MvPedidosController.$inject = ['PedidoService', '$location', 'PedidoVars', 'MvUtils', 'PedidoAdminService'];
    function MvPedidosController(PedidoService, $location, PedidoVars, MvUtils, PedidoAdminService) {

        var vm = this;

        vm.pedidos = [];
        vm.detalle = detalle;
        vm.soloActivos = true;
        vm.loadPedidos = loadPedidos;
        vm.pedido = {};
        vm.paginas = 1;
        vm.indice = -1;
        vm.detailsOpen = false;

        loadPedidos();


        PedidoAdminService.listen(function () {
            vm.detailsOpen = PedidoAdminService.detailsOpen;
            if(!vm.detailsOpen)
                loadPedidos();
        });


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
            paginar(AcUtils.next(PedidoVars));
        };
        vm.prev = function () {
            paginar(AcUtils.prev(PedidoVars));
        };
        vm.first = function () {
            paginar(AcUtils.first(PedidoVars));
        };
        vm.last = function () {
            paginar(AcUtils.last(PedidoVars));
        };

        vm.goToPagina = function () {
            paginar(AcUtils.goToPagina(vm.pagina, PedidoVars));
        }

    }


    PedidoAdminService.$inject = ['$rootScope'];
    function PedidoAdminService($rootScope) {

        this.detailsOpen = false;

        this.broadcast = function () {
            $rootScope.$broadcast("refreshDetailForm")
        };

        this.listen = function (callback) {
            $rootScope.$on("refreshDetailForm", callback)
        };
    }


})();