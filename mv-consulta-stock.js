(function () {
    'use strict';

    angular.module('mvConsultaStock', ['ngRoute'])
        .component('mvConsultaStock', mvConsultaStock());


    function mvConsultaStock() {
        return {
            bindings: {
                searchFunction: '&'
            },
            templateUrl: window.installPath + '/mv-angular-stocks/mv-consulta-stock.html',
            controller: MvConsultaStockController
        }
    }


    MvConsultaStockController.$inject = ['StockService', 'StockVars', 'MvUtils', 'SucursalesService'];
    function MvConsultaStockController(StockService, StockVars, MvUtils, SucursalesService) {

        var vm = this;

        vm.stocks = [];
        vm.todos = [];
        vm.sucursales = [];
        vm.sucursal = {};
        vm.conStock = true;
        vm.paginas = 1;
        vm.indice = -1;
        StockVars.sucursal_id = -1;


        SucursalesService.get().then(function (data) {
            vm.sucursales = data;
            vm.sucursales.push({sucursal_id: -1, nombre: "Todas", direccion: "", telefono: ""});
            vm.sucursal = vm.sucursales[vm.sucursales.length - 1];

            StockVars.sucursal_id = -1;
            vm.conStock = true;

            loadConStock();

        }).catch(function(error){
            console.log(error);
        });


        loadConStock();
        filtroSucursal();

        function loadConStock() {
            StockVars.clearCache = true;
            StockVars.reducido = (vm.conStock) ? true : false;

            StockService.get().then(function (data) {
                vm.stocks = data;
                vm.paginas = StockVars.paginas;
            }).catch(function(error){
                console.log(error);
            });
        }

        function filtroSucursal() {
            console.log(vm.sucursal);
            if (vm.sucursal.sucursal_id !== -1) {
                var results = vm.todos.filter(function (elem, index, array) {
                    return elem.sucursal_id == vm.sucursal.sucursal_id;
                });
                vm.stocks = results;
            } else {
                vm.stocks = vm.todos;
            }
        }


        // Implementación de la paginación
        vm.start = 0;
        vm.limit = StockVars.paginacion;
        vm.pagina = StockVars.pagina;
        vm.paginas = StockVars.paginas;

        function paginar(vars) {
            if (vars == {}) {
                return;
            }
            vm.start = vars.start;
            vm.pagina = vars.pagina;
        }

        vm.next = function () {
            paginar(MvUtils.next(StockVars));
        };
        vm.prev = function () {
            paginar(MvUtils.prev(StockVars));
        };
        vm.first = function () {
            paginar(MvUtils.first(StockVars));
        };
        vm.last = function () {
            paginar(MvUtils.last(StockVars));
        };

        vm.goToPagina = function () {
            paginar(MvUtils.goToPagina(vm.pagina, StockVars));
        }


    }


})();