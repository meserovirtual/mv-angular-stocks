(function () {
    'use strict';

    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length - 1].src;

    if (currentScriptPath.length == 0) {
        currentScriptPath = window.installPath + '/mv-angular-stocks/includes/mv-stocks.php';
    }

    angular.module('mvStocks', [])
        .factory('PedidoService', PedidoService)
        .service('PedidoVars', PedidoVars)
        .factory('StockService', StockService)
        .service('StockVars', StockVars)
    ;


    PedidoService.$inject = ['$http', 'PedidoVars', '$cacheFactory', 'MvUtils', 'MvUtilsGlobals', 'ErrorHandler', '$q'];
    /**
     * @description Administrador de pedidos
     * @param $http
     * @param PedidoVars
     * @param $cacheFactory
     * @param MvUtils
     * @returns {{}}
     * @constructor
     */
    function PedidoService($http, PedidoVars, $cacheFactory, MvUtils, MvUtilsGlobals, ErrorHandler, $q) {
        //Variables
        var service = {};

        var url = currentScriptPath.replace('mv-stocks.js', '/includes/mv-stocks.php');

        //Function declarations
        service.get = get;
        service.getPedidosDetalles = getPedidosDetalles;
        service.getByParams = getByParams;

        service.save = save;
        service.create = create;
        service.createPedidoDetalle = createPedidoDetalle;

        service.update = update;
        service.updatePedidoDetalle = updatePedidoDetalle;
        service.confirmarPedido = confirmarPedido; //Hacer update de fecha_entrega a now(); Generar Stock;
        service.faltantes = faltantes;

        service.remove = remove;
        service.removePedidoDetalle = removePedidoDetalle;


        service.goToPagina = goToPagina;
        service.next = next;
        service.prev = prev;

        return service;

        //Functions
        /**
         * @description Devuelve los detalles de un pedido determinado
         * @param pedido_id
         * @param callback
         * @returns {*}
         */
        function getPedidosDetalles(pedido_id, callback) {
            return $http.get(url + '?function=getPedidoDetalles&pedido_id=' + pedido_id, {cache: false})
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                    PedidoVars.clearCache = false;
                })
        }

        /**
         * @description Modifica un detalle en particular
         * @param pedido_detalle
         * @param callback
         * @returns {*}
         */
        function updatePedidoDetalle(pedido_detalle, callback) {
            return $http.post(url,
                {
                    'function': 'updatePedidoDetalle',
                    'pedido_detalle': JSON.stringify(pedido_detalle)
                })
                .success(function (data) {
                    PedidoVars.clearCache = true;
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                });
        }

        /**
         * @description crea un detalle
         * @param pedido_detalle
         * @param callback
         * @returns {*}
         */
        function createPedidoDetalle(pedido_detalle, callback) {
            return $http.post(url,
                {
                    'function': 'createPedidoDetalle',
                    'pedido_detalle': JSON.stringify(pedido_detalle)
                })
                .success(function (data) {
                    PedidoVars.clearCache = true;
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                });
        }

        /**
         * @description Elimina un detalle en particular
         * @param pedido_detalle_id
         * @param callback
         * @returns {*}
         */
        function removePedidoDetalle(pedido_detalle_id, callback) {
            return $http.post(url,
                {
                    'function': 'removePedidoDetalle',
                    'pedido_detalle_id': JSON.stringify(pedido_detalle_id)
                })
                .success(function (data) {
                    PedidoVars.clearCache = true;
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                });
        }


        /**
         * Proceso que se ocupa de generar faltantes, ya sea en un pedido nuevo o en un pedido existente
         * @param pedido_origen
         * @param pedido_destino
         * @param faltantes
         * @param usuario_id
         * @param callback
         */
        function faltantes(pedido_origen, pedido_destino, faltantes, usuario_id, callback) {
            var total_pedido_origen = 0.0;
            var total_pedido_faltantes = 0.0;


            for (var i = 0; i < faltantes.length; i++) {

                total_pedido_faltantes = parseFloat(total_pedido_faltantes) + parseFloat(faltantes[i].precio_total);

            }

            total_pedido_origen = parseFloat(pedido_origen.total) - total_pedido_faltantes;
            //console.log(total_pedido_origen);
            //console.log(total_pedido_faltantes);


            var nuevo_pedido = {
                detalles: [], iva: '', pedido_id: -1,
                proveedor_nombre: '', sucursal_id: '', total: 0.0, usuario_id: 1, proveedor_id: 0
            };

            nuevo_pedido.pedidos_detalles = faltantes;
            nuevo_pedido.iva = pedido_origen.iva;
            nuevo_pedido.pedido_id = pedido_origen.pedido_id;
            nuevo_pedido.proveedor_nombre = pedido_origen.proveedor_nombre;
            nuevo_pedido.sucursal_id = pedido_origen.sucursal_id;
            nuevo_pedido.total = total_pedido_faltantes;
            nuevo_pedido.usuario_id = usuario_id;
            nuevo_pedido.proveedor_id = pedido_origen.proveedor_id;

            pedido_origen.total = total_pedido_origen;


            var detallesSinFaltantes = pedido_origen.pedidos_detalles.filter(
                function (elem, index, array) {
                    var encontrado = false;
                    for (var x = 0; x < faltantes.length; x++) {
                        if (elem.pedido_detalle_id == faltantes[x].pedido_detalle_id) {
                            encontrado = true;
                        }
                    }

                    if (!encontrado) {
                        return elem;
                    }
                }
            );

            pedido_origen.pedidos_detalles = detallesSinFaltantes;

            //console.log(vm.pedido);
            //console.log(vm.nuevoPedido);


            if (pedido_destino.pedido_id === -1) {

                create(nuevo_pedido, function (data) {
                    //console.log(data);
                    update(pedido_origen, function (data) {
                        //console.log(data);
                        callback(data);
                    })
                })
            } else {
                //vm.nuevoPedido = {};
                //vm.nuevoPedido = vm.pedido;
                //vm.nuevoPedido.detalles = vm.faltantes;


                getByParams('pedido_id', pedido_destino.pedido_id, true, function (data) {

                    for (var i = 0; i < data.detalles.length; i++) {
                        data.pedidos_detalles.push(data.pedidos_detalles[i]);
                    }

                    //data.pedidos_detalles = faltantes;
                    data.total = parseFloat(data.total) + total_pedido_faltantes;
                    //console.log(vm.pedido);
                    //console.log(data);

                    update(data, function (data) {
                        update(pedido_origen, function (data) {
                            callback(data);
                            //console.log(data);
                        })
                    })
                });
            }
        }


        /**
         * @description Obtiene todos los pedidos
         * @param callback
         * @returns {*}
         */
        function get(callback) {
            var urlGet = url + '?function=getPedidos&all=' + PedidoVars.all;
            var $httpDefaultCache = $cacheFactory.get('$http');
            var cachedData = [];

            // Verifica si existe el cache de pedidos
            if ($httpDefaultCache.get(urlGet) != undefined) {
                if (PedidoVars.clearCache) {
                    $httpDefaultCache.remove(urlGet);
                }
                else {
                    var deferred = $q.defer();
                    cachedData = $httpDefaultCache.get(urlGet);
                    deferred.resolve(cachedData);
                    return deferred.promise;
                }
            }

            return $http.get(urlGet, {cache: true})
                .then(function (response) {
                    $httpDefaultCache.put(urlGet, response.data);
                    PedidoVars.clearCache = false;
                    PedidoVars.paginas = (response.data.length % PedidoVars.paginacion == 0) ? parseInt(response.data.length / PedidoVars.paginacion) : parseInt(response.data.length / PedidoVars.paginacion) + 1;
                    return response.data;
                })
                .catch(function (response) {
                    PedidoVars.clearCache = false;
                    ErrorHandler(response);
                })
        }


        /**
         * @description Retorna la lista filtrada de pedidos
         * @param param -> String, separado por comas (,) que contiene la lista de parámetros de básqueda, por ej: nombre, sku
         * @param value
         * @param callback
         */
        /*
        function getByParams(params, values, exact_match, callback) {
            get(function (data) {
                MvUtils.getByParams(params, values, exact_match, data, callback);
            })
        }
        */
        function getByParams(params, values, exact_match) {
            return get().then(function (data) {
                return MvUtils.getByParams(params, values, exact_match, data);
            }).then(function (data) {
                return data;
            });
        }

        /** @name: remove
         * @param pedido_id
         * @param callback
         * @description: Elimina el pedido seleccionado.
         */
        function remove(pedido_id) {
            return $http.post(url,
                {function: 'removePedido', 'pedido_id': pedido_id})
                .then(function (data) {
                    PedidoVars.clearCache = true;
                    return data;
                })
                .catch(function (data) {
                    PedidoVars.clearCache = true;
                    ErrorHandler(data);
                })
        }

        /**
         *
         * @param pedido
         * @returns {*}
         */
        function save(pedido) {
            var deferred = $q.defer();

            if (pedido.pedido_id != undefined) {
                deferred.resolve(update(pedido));
            } else {
                deferred.resolve(create(pedido));
            }
            return deferred.promise;
        }


        /**
         * @description: Crea un pedido.
         * @param pedido
         * @param callback
         * @returns {*}
         */
        function create(pedido) {
            return $http.post(url,
                {
                    'function': 'createPedido',
                    'pedido': JSON.stringify(pedido)
                })
                .then(function (data) {
                    PedidoVars.clearCache = true;
                    return data;
                })
                .catch(function (data) {
                    PedidoVars.clearCache = true;
                    ErrorHandler(data);
                });
        }


        /** @name: update
         * @param pedido
         * @param callback
         * @description: Realiza update al pedido.
         */
        function update(pedido) {
            return $http.post(url,
                {
                    'function': 'updatePedido',
                    'pedido': JSON.stringify(pedido)
                })
                .then(function (data) {
                    PedidoVars.clearCache = true;
                    return data;
                })
                .catch(function (data) {
                    PedidoVars.clearCache = true;
                    ErrorHandler(data);
                });
        }

        /** @name: Confirma un pedido
         * @param pedido
         * @param callback
         * @description: Realiza update al pedido.
         */
        function confirmarPedido(pedido) {
            pedido.fecha_entrega = 'now';
            MvUtilsGlobals.startWaiting();
            return $http.post(url,
                {
                    'function': 'updatePedido',
                    'pedido': JSON.stringify(pedido)
                })
                .then(function (response) {
                    PedidoVars.clearCache = true;
                    MvUtilsGlobals.stopWaiting();
                    return response.data;
                })
                .catch(function (response) {
                    MvUtilsGlobals.stopWaiting();
                    ErrorHandler(response.data);
                });
        }

        /**
         * Para el uso de la páginacián, definir en el controlador las siguientes variables:
         *
         vm.start = 0;
         vm.pagina = PedidoVars.pagina;
         PedidoVars.paginacion = 5; Cantidad de registros por página
         vm.end = PedidoVars.paginacion;


         En el HTML, en el ng-repeat agregar el siguiente filtro: limitTo:appCtrl.end:appCtrl.start;

         Agregar un botán de next:
         <button ng-click="appCtrl.next()">next</button>

         Agregar un botán de prev:
         <button ng-click="appCtrl.prev()">prev</button>

         Agregar un input para la página:
         <input type="text" ng-keyup="appCtrl.goToPagina()" ng-model="appCtrl.pagina">

         */


        /**
         * @description: Ir a página
         * @param pagina
         * @returns {*}
         * uso: agregar un mátodo
         vm.goToPagina = function () {
                vm.start= PedidoService.goToPagina(vm.pagina).start;
            };
         */
        function goToPagina(pagina) {

            if (isNaN(pagina) || pagina < 1) {
                PedidoVars.pagina = 1;
                return PedidoVars;
            }

            if (pagina > PedidoVars.paginas) {
                PedidoVars.pagina = PedidoVars.paginas;
                return PedidoVars;
            }

            PedidoVars.pagina = pagina - 1;
            PedidoVars.start = PedidoVars.pagina * PedidoVars.paginacion;
            return PedidoVars;

        }

        /**
         * @name next
         * @description Ir a práxima página
         * @returns {*}
         * uso agregar un metodo
         vm.next = function () {
                vm.start = PedidoService.next().start;
                vm.pagina = PedidoVars.pagina;
            };
         */
        function next() {

            if (PedidoVars.pagina + 1 > PedidoVars.paginas) {
                return PedidoVars;
            }
            PedidoVars.start = (PedidoVars.pagina * PedidoVars.paginacion);
            PedidoVars.pagina = PedidoVars.pagina + 1;
            //PedidoVars.end = PedidoVars.start + PedidoVars.paginacion;
            return PedidoVars;
        }

        /**
         * @name previous
         * @description Ir a página anterior
         * @returns {*}
         * uso, agregar un mátodo
         vm.prev = function () {
                vm.start= PedidoService.prev().start;
                vm.pagina = PedidoVars.pagina;
            };
         */
        function prev() {


            if (PedidoVars.pagina - 2 < 0) {
                return PedidoVars;
            }

            //PedidoVars.end = PedidoVars.start;
            PedidoVars.start = (PedidoVars.pagina - 2 ) * PedidoVars.paginacion;
            PedidoVars.pagina = PedidoVars.pagina - 1;
            return PedidoVars;
        }


    }

    PedidoVars.$inject = [];
    /**
     * @description Almacena variables temporales de productos
     * @constructor
     */
    function PedidoVars() {
        // Cantidad de páginas total del recordset
        this.paginas = 1;
        // Página seleccionada
        this.pagina = 1;
        // Cantidad de registros por página
        this.paginacion = 10;
        // Registro inicial, no es página, es el registro
        this.start = 0;


        // Indica si debe traer todos los pedidos o solo los activos, por defecto, solo los activos
        this.all = false;
        // Indica si se debe limpiar el cachá la práxima vez que se solicite un get
        this.clearCache = true;

    }


    StockService.$inject = ['$http', 'StockVars', '$cacheFactory', 'MvUtils', 'ErrorHandler', 'MvUtilsGlobals', 'UserService', '$q'];
    function StockService($http, StockVars, $cacheFactory, MvUtils, ErrorHandler, MvUtilsGlobals, UserService, $q) {
        //Variables
        var service = {};

        var url = currentScriptPath.replace('mv-stocks.js', '/includes/mv-stocks.php');

        //Function declarations
        service.get = get;
        service.getByParams = getByParams;

        service.create = create;

        service.update = update;
        service.aReponer = aReponer;
        service.trasladar = trasladar; // Por performance es mejor hacer en el php
        service.getDisponibles = getDisponibles;
        service.getFraccionables = getFraccionables;
        service.getAReponer = getAReponer;

        service.remove = remove;


        service.goToPagina = goToPagina;
        service.next = next;
        service.prev = prev;

        return service;

        //Functions
        /**
         * @description Retorna los productos que son fraccionables
         * @param callback
         */
        function getFraccionables() {

            return get().then(function (data) {
                var response = [];
                if (data.length > 0) {
                    response = data.filter(function (element, index, array) {

                        if (parseInt(element.producto_tipo) == 4 && parseInt(element.cant_actual) > 0) {
                            return element;
                        }
                    });
                }

                return response;
            }).then(function (data) {
                return data;
            });

            //get(function (data) {
            //    var response = [];
            //    if (data.length > 0) {
            //        response = data.filter(function (element, index, array) {
            //
            //            if (parseInt(element.producto_tipo) == 4 && parseInt(element.cant_actual) > 0) {
            //                return element;
            //            }
            //        });
            //    }
            //
            //    callback(response);
            //})
        }


        function getDisponibles(sucursal_id, nombreProducto, callback) {

            get(function (data) {

                var response = [];
                var productos = [];
                if (data.length > 0) {
                    response = data.filter(function (element, index, array) {


                        //if (element.sucursal_id == sucursal_id &&
                        if ((element.nombreProducto.toUpperCase().indexOf(nombreProducto.toUpperCase()) > -1 ||
                            (element.sku != null && element.sku.indexOf(nombreProducto) > -1)) &&
                            (element.cant_actual > 0 || element.producto_tipo == 2 || element.producto_tipo == 3)) {


                            var encontrado = false;
                            for (var i = 0; i < productos.length; i++) {

                                if (productos[i].producto_id == element.producto_id) {
                                    encontrado = true;


                                    // Esto es solo para que funcione con los movimientos, hay que sacarlo cuando volvamos a hacer movimientos

                                    var st = {
                                        cant_actual: element.cant_actual,
                                        costo_uni: element.costo_uni,
                                        stock_id: element.stock_id,
                                        sucursal_id: element.sucursal_id

                                    };
                                    productos[i].stock.push(st);
                                    productos[i].cant_actual = element.cant_actual + productos[i].cant_actual;

                                }
                            }

                            if (!encontrado) {
                                var prod = angular.copy(element);

                                // Esto es solo para que funcione con los movimientos, hay que sacarlo cuando volvamos a hacer movimientos
                                prod.stock = [];
                                var st = {
                                    cant_actual: prod.cant_actual,
                                    costo_uni: prod.costo_uni,
                                    stock_id: prod.stock_id,
                                    sucursal_id: prod.sucursal_id

                                };
                                prod.stock.push(st);
                                //
                                productos.push(prod);
                            }

                        }
                    });
                }

                callback(productos);
            })
        }

        /**
         * @description Devuelve una lista de productos a reponer
         * @param callback
         */
        function aReponer(callback) {
            StockVars.clearCache = true;
            get(function (data) {
                var response = data.filter(function (element, index, array) {
                    return element.cant_actual < element.pto_repo;
                });

                callback(response);
            })
        }

        /**
         * @description traslada una cantidad determinada de productos de una sucursal a otra
         * @param origen_id
         * @param destino_id
         * @param producto_id
         * @param cantidad
         * @param callback
         * @returns {*}
         */
        function trasladar(detalles) {


            MvUtilsGlobals.startWaiting();
            return $http.post(url,
                {
                    function: 'trasladar',
                    detalles: JSON.stringify(detalles)
                })
                .then(function (response) {
                    StockVars.clearCache = true;
                    MvUtilsGlobals.stopWaiting();
                    return response.data;
                })
                .catch(function (response) {

                    ErrorHandler(response.data);
                    MvUtilsGlobals.stopWaiting();
                })
        }

        /**
         * @description Obtiene todos los stock
         * @param callback
         * @returns {*}
         */
        function get() {
            MvUtilsGlobals.startWaiting();
            var sucursal = (MvUtilsGlobals.sucursal_id_search != undefined && MvUtilsGlobals.sucursal_id_search != 0) ? MvUtilsGlobals.sucursal_id_search : UserService.getFromToken().data.sucursal_id;
            console.log(sucursal);
            var urlGet = url + '?function=getStocks&sucursal_id=' + sucursal;
            var $httpDefaultCache = $cacheFactory.get('$http');
            var cachedData = [];


            // Verifica si existe el cache de stock
            if ($httpDefaultCache.get(urlGet) != undefined) {
                if (StockVars.clearCache) {
                    $httpDefaultCache.remove(urlGet);
                }
                else {
                    var deferred = $q.defer();
                    cachedData = $httpDefaultCache.get(urlGet);
                    deferred.resolve(cachedData);
                    MvUtilsGlobals.stocks = cachedData;
                    MvUtilsGlobals.stopWaiting();
                    return deferred.promise;
                }
            }


            return $http.get(urlGet, {cache: true})
                .then(function (response) {

                    // TODO: Ver como optimizar estas funciones
                    // Le agrego los stocks a los kits para tenerlo con fácil acceso
                    for (var i in response.data) {
                        response.data[i].precios.sort(function (a, b) {
                            // Turn your strings into dates, and then subtract them
                            // to get a value that is either negative, positive, or zero.
                            return a.precio_tipo_id - b.precio_tipo_id;
                        });
                        if (response.data[i].kits.length > 0) {
                            //console.log(response.data[i]);
                            for (var x in response.data[i].kits) {
                                for (var z in response.data) {
                                    if (response.data[i].kits[x].producto_kit_id == response.data[z].producto_id) {
                                        response.data[i].kits[x]['stocks'] = response.data[z].stocks;
                                    }
                                }
                            }
                        }
                    }


                    // Remuevo los kits que no tienen stock en alguno de sus componentes
                    for (var i in response.data) {
                        if (response.data[i].kits.length > 0) {
                            for (var x in response.data[i].kits) {
                                if (response.data[i].kits[x].stocks == undefined || response.data[i].kits[x].stocks.length == 0) {
                                    response.data.splice(i, 1);
                                    break;
                                }
                            }
                        }
                    }


                    for(var i in response.data){
                        if(response.data[i].producto_id == '123'){
                            console.log(response.data[i]);
                        }
                    }

                    $httpDefaultCache.put(urlGet, response.data);
                    StockVars.clearCache = false;
                    StockVars.paginas = (response.data.length % StockVars.paginacion == 0) ? parseInt(response.data.length / StockVars.paginacion) : parseInt(response.data.length / StockVars.paginacion) + 1;
                    MvUtilsGlobals.stocks = response.data;
                    MvUtilsGlobals.stopWaiting();
                    return response.data;
                })
                .catch(function (response) {
                    StockVars.clearCache = false;
                    MvUtilsGlobals.stopWaiting();
                    ErrorHandler(response);
                })
        }


        /**
         * @description Retorna la lista filtrada de stocks
         * @param param -> String, separado por comas (,) que contiene la lista de parámetros de básqueda, por ej: nombre, sku
         * @param value
         * @param callback
         */
        function getByParams(params, values, exact_match) {
            return get().then(function (data) {
                return MvUtils.getByParams(params, values, exact_match, data);
            }).then(function (data) {
                return data;
            });
        }

        function getAReponer(sucursal) {
            return $http.get(url + '?function=getAReponer&sucursal_id=' + sucursal)
                .then(function (response) {
                    return response.data;
                })
                .catch(function (response) {
                    StockVars.clearCache = false;
                    MvUtilsGlobals.stopWaiting();
                    ErrorHandler(response);
                })

        }

        /** @name: remove
         * @param stock_id
         * @param callback
         * @description: Elimina el stock seleccionado.
         */
        function remove(stock_id, callback) {
            return $http.post(url,
                {function: 'removeStock', 'stock_id': stock_id})
                .success(function (data) {
                    //console.log(data);
                    if (data !== 'false') {
                        StockVars.clearCache = true;
                        callback(data);
                    }
                })
                .error(function (data) {
                    callback(data);
                })
        }

        /**
         * @description: Crea un stock.
         * @param stock
         * @param callback
         * @returns {*}
         */
        function create(stock) {
            return $http.post(url,
                {
                    'function': 'createStock',
                    'stock': JSON.stringify(stock)
                })
                .then(function (response) {
                    StockVars.clearCache = true;
                    return response.data;
                })
                .catch(function (response) {
                    StockVars.clearCache = true;
                    ErrorHandler(response.data);
                });
        }


        /** @name: update
         * @param stock
         * @param callback
         * @description: Realiza update al stock.
         */
        function update(stock) {
            return $http.post(url,
                {
                    'function': 'updateStock',
                    'stock': JSON.stringify(stock)
                })
                .then(function (response) {
                    StockVars.clearCache = true;
                    return response.data;
                })
                .catch(function (response) {
                    ErrorHandler(response.data);
                });
        }

        /**
         * Para el uso de la páginacián, definir en el controlador las siguientes variables:
         *
         vm.start = 0;
         vm.pagina = StockVars.pagina;
         StockVars.paginacion = 5; Cantidad de registros por página
         vm.end = StockVars.paginacion;


         En el HTML, en el ng-repeat agregar el siguiente filtro: limitTo:appCtrl.end:appCtrl.start;

         Agregar un botán de next:
         <button ng-click="appCtrl.next()">next</button>

         Agregar un botán de prev:
         <button ng-click="appCtrl.prev()">prev</button>

         Agregar un input para la página:
         <input type="text" ng-keyup="appCtrl.goToPagina()" ng-model="appCtrl.pagina">

         */


        /**
         * @description: Ir a página
         * @param pagina
         * @returns {*}
         * uso: agregar un mátodo
         vm.goToPagina = function () {
                vm.start= StockService.goToPagina(vm.pagina).start;
            };
         */
        function goToPagina(pagina) {

            if (isNaN(pagina) || pagina < 1) {
                StockVars.pagina = 1;
                return StockVars;
            }

            if (pagina > StockVars.paginas) {
                StockVars.pagina = StockVars.paginas;
                return StockVars;
            }

            StockVars.pagina = pagina - 1;
            StockVars.start = StockVars.pagina * StockVars.paginacion;
            return StockVars;

        }

        /**
         * @name next
         * @description Ir a próxima página
         * @returns {*}
         * uso agregar un metodo
         vm.next = function () {
                vm.start = StockService.next().start;
                vm.pagina = StockVars.pagina;
            };
         */
        function next() {

            if (StockVars.pagina + 1 > StockVars.paginas) {
                return StockVars;
            }
            StockVars.start = (StockVars.pagina * StockVars.paginacion);
            StockVars.pagina = StockVars.pagina + 1;
            //StockVars.end = StockVars.start + StockVars.paginacion;
            return StockVars;
        }

        /**
         * @name previous
         * @description Ir a página anterior
         * @returns {*}
         * uso, agregar un método
         vm.prev = function () {
                vm.start= StockService.prev().start;
                vm.pagina = StockVars.pagina;
            };
         */
        function prev() {


            if (StockVars.pagina - 2 < 0) {
                return StockVars;
            }

            //StockVars.end = StockVars.start;
            StockVars.start = (StockVars.pagina - 2 ) * StockVars.paginacion;
            StockVars.pagina = StockVars.pagina - 1;
            return StockVars;
        }


    }

    StockVars.$inject = [];
    /**
     * @description Almacena variables temporales de stocks
     * @constructor
     */
    function StockVars() {
        // Cantidad de páginas total del recordset
        this.paginas = 1;
        // Página seleccionada
        this.pagina = 1;
        // Cantidad de registros por página
        this.paginacion = 10;
        // Registro inicial, no es página, es el registro
        this.start = 0;

        // Variable que regristra si se traen todos los stocks o solos los mayores a 0
        this.reducido = true;
        this.reducido = true;

        // Indica si se debe limpiar el cachá la práxima vez que se solicite un get
        this.clearCache = true;

    }

})();