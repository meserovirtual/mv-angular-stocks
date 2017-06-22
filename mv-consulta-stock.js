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


    MvConsultaStockController.$inject = ['StockService', 'StockVars', 'MvUtils', 'SucursalesService', 'MvUtilsGlobals'];
    function MvConsultaStockController(StockService, StockVars, MvUtils, SucursalesService, MvUtilsGlobals) {

        var vm = this;

        vm.stocks = [];
        vm.todos = [];
        vm.sucursales = [];
        vm.sucursal = {};
        vm.sinStock = false;
        vm.paginas = 1;
        vm.indice = -1;
        StockVars.sucursal_id = -1;


        //FUNCIONES
        vm.loadSucursales = loadSucursales;
        vm.loadStockPorSucursal = loadStockPorSucursal;


        loadSucursales();
        loadStockPorSucursal();


        function loadSucursales() {
            SucursalesService.get().then(function (data) {
                vm.sucursales = data;
                vm.sucursales.push({sucursal_id: -1, nombre: "Todas", direccion: "", telefono: ""});
                vm.sucursal = vm.sucursales[vm.sucursales.length - 1];
            }).catch(function(error){
                console.log(error);
            });
        }


        function loadStockPorSucursal() {
            vm.stocks = [];
            StockVars.clearCache = true;
            MvUtilsGlobals.sucursal_id_search = vm.sucursal.sucursal_id;
            StockService.get().then(function (data) {
                if(vm.sinStock) {
                    for(var i=0; i < data.length - 1; i++) {
                        if(data[i].stocks[0].cant_actual < data[i].pto_repo){
                            vm.stocks.push(data[i]);
                        }
                    }
                } else {
                    vm.stocks = data;
                }
            }).catch(function(error){
                console.log(error);
            });
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