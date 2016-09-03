(function () {


    'use strict';
    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length - 1].src;

    angular.module('acPedidosDetalles', [])
        .component('acPedidosDetalles', acPedidosDetalles())
    ;

    function acPedidosDetalles() {
        return {
            bindings: {
                pedido: '='
            },
            templateUrl: window.installPath + '/ac-angular-stocks/ac-pedidos-detalles.html',
            controller: PedidosController
        }
    }


    PedidosController.$inject = ['$routeParams', 'ProductService', 'PedidoService', '$location', '$window',
        'UserService', 'SucursalesService', 'ProductVars', 'PedidoVars', 'AcUtils', '$scope'];
    function PedidosController($routeParams, ProductService, PedidoService, $location, $window,
                               UserService, SucursalesService, ProductVars, PedidoVars, AcUtils, $scope) {

        var vm = this;
        vm.isUpdate = false;
        vm.id = $routeParams.id;
        vm.pedido_faltante_id = -1;
        vm.productos = [];
        vm.mostrarMoverFaltantes = false;
        vm.pedidosActivos = [];
        vm.user = {user_id: 1};
        //vm.pedido = {
        //    proveedor_id: 0,
        //    usuario_id: vm.user.user_id,
        //    fecha_pedido: '',
        //    fecha_entrega: '',
        //    total: 0,
        //    iva: 0,
        //    sucursal_id: 0,
        //    pedidos_detalles: []
        //};
        vm.detalle = {
            pedido_id: 0,
            producto_id: 0,
            producto_nombre: '',
            cantidad: 0,
            precio_unidad: 0,
            precio_total: 0
        };
        vm.producto = {
            nombre: '',
            descripcion: '',
            ptoRepo: 0,
            status: 1,
            destacado: 0,
            fotos: [],
            precios: [],
            proveedores: [],
            insumo: 0
        };
        vm.faltantes = [];
        vm.detalles = [];
        vm.proveedores = [];
        vm.proveedor = {};
        //vm.pedido.proveedor_id = 1;
        //vm.pedido.sucursal_id = 1;
        vm.busqueda = '';
        vm.sucursales = [];


        //vm.mostrarPanel = mostrarPanel;
        //vm.selectProducto = selectProducto;
        vm.agregarDetalle = agregarDetalle;
        vm.removeDetalle = removeDetalle;
        vm.recalcularTotalDetalle = recalcularTotalDetalle;
        vm.save = save;
        //vm.confirmar = confirmar;
        vm.agregarFaltante = agregarFaltante;
        vm.moverFaltantes = moverFaltantes;
        vm.confirmarPedidoFaltante = confirmarPedidoFaltante;
        vm.deletePedido = deletePedido;
        vm.cleanProductos = cleanProductos;
        vm.searchProducto = searchProducto;

        function searchProducto(callback) {
            ProductService.get().then(callback);
        }

        SucursalesService.get().then(function (data) {
            vm.sucursales = data;
            return UserService.getByParams('rol_id', '2', 'true');
        }).then(function (data) {
            vm.proveedores = data;
            vm.pedido.proveedor_id = vm.proveedores[0].proveedor_id;
        });

        $scope.$watch('$ctrl.pedido', function () {
            if (vm.pedido != undefined) {
                if (vm.pedido.sucursal_id == undefined) {
                    vm.pedido.sucursal_id = UserService.getFromToken().data.sucursal_id;
                }
                if (vm.pedido.proveedor_id == undefined && vm.proveedores.length > 0) {
                    vm.pedido.proveedor_id = parseInt(vm.proveedores[0].usuario_id);
                }
            }
        });

        //if (vm.id == 0) {
        //    vm.isUpdate = false;
        //    SucursalesService.get(function (data) {
        //        vm.sucursales = data;
        //        vm.pedido.sucursal_id = parseInt(data[0].sucursal_id);
        //        UserService.getByParams('rol_id', '2', 'true', function (data) {
        //            vm.proveedores = data;
        //            vm.pedido.proveedor_id = parseInt(vm.proveedores[0].proveedor_id);
        //            //console.log(data[0].proveedor_id);
        //            vm.pedido.proveedor_id = vm.proveedores[0].usuario_id;
        //
        //        });
        //    });
        //} else {
        //    vm.isUpdate = true;
        //
        //    SucursalesService.get(function (data) {
        //        vm.sucursales = data;
        //        UserService.getByParams('rol_id', '2', 'true', function (data) {
        //            vm.proveedores = data;
        //            PedidoService.getByParams('pedido_id', '' + vm.id, 'true', function (data) {
        //
        //                vm.pedido = data[0];
        //                for (var i = 0; i < vm.pedido.pedidos_detalles.length; i++) {
        //                    vm.pedido.pedidos_detalles[i].precio_unidad = parseFloat(vm.pedido.pedidos_detalles[i].precio_unidad);
        //                }
        //
        //
        //            });
        //        });
        //    });
        //}


        function cleanProductos() {

            if (vm.pedido.detalles.length > 0) {

                var r = confirm('Si cambia el proveedor, todo los productos serán eliminados');
                if (r) {
                    vm.pedido.detalles = [];

                }

            }
        }

        function deletePedido() {
            PedidoService.remove(vm.id,
                function (data) {
                    if (data > 0) {
                        AcUtils.showMessage('success', 'Pedido borrado con éxito.');
                        $location.path('/caja/cobros');
                    } else {
                        AcUtils.showMessage('success', 'Error al borrar el pedido.');
                    }
                });

        }

        function recalcularTotalDetalle(detalle) {
            vm.pedido.total = parseFloat(vm.pedido.total) - parseFloat(detalle.precio_total);
            detalle.precio_total = detalle.cantidad * detalle.precio_unidad;
            vm.pedido.total = parseFloat(vm.pedido.total) + parseFloat(detalle.precio_total);
        }


        function agregarDetalle() {
            if (vm.producto.producto_id === undefined || vm.producto.producto_id == -1
                || vm.producto.producto_id == '') {
                AcUtils.showMessage('error', 'Debe seleccionar un producto');
                return;
            }

            vm.detalle = {
                pedido_id: 0,
                producto_id: vm.producto.producto_id,
                nombre: vm.producto.nombre,
                cantidad: vm.cantidad,
                precio_unidad: vm.precio_unidad_prod,
                precio_total: parseInt(vm.cantidad) * parseFloat(vm.precio_unidad_prod),
                insumo: vm.producto.insumo
            };

            vm.pedido.total = parseFloat(vm.pedido.total) + parseFloat(vm.detalle.precio_total);

            vm.pedido.pedidos_detalles.push(vm.detalle);

            vm.producto.producto_id = '';
            vm.producto.nombre = '';
            vm.cantidad = '';
            vm.precio_unidad_prod = '';
            var el = document.getElementById('searchProducto').getElementsByTagName('input');
            if (el[0] != null) {
                el[0].focus();
                el[0].value = '';
            }


            vm.detalle = {};


        }

        function removeDetalle(index) {
            var r = confirm('Realmente desea eliminar el producto del pedido?');
            if (r) {
                vm.pedido.total = parseFloat(vm.pedido.total) - parseFloat(vm.pedido.pedidos_detalles[index].precio_total);
                vm.pedido.pedidos_detalles.splice(index, 1);
            }
        }

        //function confirmar() {
        //    PagoProveedoresPedidoService.pedido = vm.pedido;
        //    $location.path('/pago_proveedores/' + vm.pedido.pedido_id);
        //    ProductVars.clearCache = true;
        //    ProductService.get(function (data) {
        //    });
        //
        //}

        function save() {

            vm.pedido.usuario_id = UserService.getFromToken().data.id;
            if (vm.pedido.pedido_id != undefined && vm.pedido.pedido_id != -1) {
                PedidoService.update(vm.pedido,
                    function (data) {

                        if (data != -1) {
                            AcUtils.showMessage('success', 'Pedido modificado con �xito.');
                            $location.path('/caja/cobros');

                        } else {
                            AcUtils.showMessage('success', 'Error al modificar el pedido.');
                        }
                        ProductVars.clearCache = true;
                        ProductService.get(function (data) {
                        });
                    });
            } else {
                PedidoService.create(vm.pedido,
                    function (data) {

                        if (data !== -1) {
                            AcUtils.showMessage('success', 'Pedido generado con éxito.');
                            $location.path('/caja/cobros');
                        } else {
                            AcUtils.showMessage('success', 'Error al generar el pedido.');
                        }
                        ProductVars.clearCache = true;
                        ProductService.get(function (data) {
                        });
                    });
            }
        }

        function agregarFaltante(detalle) {
            var existe = false;
            for (var i = 0; i < vm.faltantes.length; i++) {
                if (detalle === vm.faltantes[i]) {
                    existe = true;
                    vm.faltantes.splice(i, 1);
                }
            }

            if (!existe) {
                vm.faltantes.push(detalle);
            }

            //console.log(vm.faltantes);

        }


        function confirmarPedidoFaltante() {

            var total_pedido_origen = 0.0;
            var total_pedido_faltantes = 0.0;


            for (var i = 0; i < vm.faltantes.length; i++) {

                total_pedido_faltantes = parseFloat(total_pedido_faltantes) + parseFloat(vm.faltantes[i].precio_total);

            }

            total_pedido_origen = parseFloat(vm.pedido.total) - total_pedido_faltantes;

            vm.nuevoPedido = {
                detalles: [], iva: '', pedido_id: -1,
                proveedor_nombre: '', sucursal_id: '', total: 0.0, usuario_id: 1, proveedor_id: 0
            };

            vm.nuevoPedido.pedidos_detalles = vm.faltantes;
            vm.nuevoPedido.iva = vm.pedido.iva;
            vm.nuevoPedido.pedido_id = vm.pedido.pedido_id;
            vm.nuevoPedido.proveedor_nombre = vm.pedido.proveedor_nombre;
            vm.nuevoPedido.sucursal_id = vm.pedido.sucursal_id;
            vm.nuevoPedido.total = total_pedido_faltantes;
            vm.nuevoPedido.usuario_id = vm.user.user_id;
            vm.nuevoPedido.proveedor_id = vm.pedido.proveedor_id;

            vm.pedido.total = total_pedido_origen;


            var detallesSinFaltantes = vm.pedido.pedidos_detalles.filter(
                function (elem, index, array) {
                    var encontrado = false;
                    for (var x = 0; x < vm.faltantes.length; x++) {
                        if (elem.pedido_detalle_id == vm.faltantes[x].pedido_detalle_id) {
                            encontrado = true;
                        }
                    }

                    if (!encontrado) {
                        return elem;
                    }
                }
            );

            vm.pedido.pedidos_detalles = detallesSinFaltantes;

            if (vm.pedido_faltante_id === -1) {

                PedidoService.create(vm.nuevoPedido, function (data) {
                    //console.log(data);
                    PedidoService.update(vm.pedido, function (data) {
                        AcUtils.showMessage('success', 'Pedido creado con éxito');
                        $location.path('/caja/cobros');
                        //console.log(data);
                    })
                })
            } else {

                PedidoService.getByParams('pedido_id', '' + vm.pedido_faltante_id, 'true', function (data) {

                    for (var i = 0; i < data[0].pedidos_detalles.length; i++) {
                        vm.faltantes.push(data[0].pedidos_detalles[i]);
                    }

                    data[0].pedidos_detalles = vm.faltantes;
                    data[0].total = parseFloat(data[0].total) + total_pedido_faltantes;

                    PedidoService.update(data[0], function (data) {
                        PedidoService.update(vm.pedido, function (data) {
                            AcUtils.showMessage('success', 'Pedido modificado con éxito');
                            $location.path('/caja/cobros');
                            //console.log(data);
                        })
                    })
                });


                //PedidoService.savePedidoDetalles(vm.pedido_faltante_id, vm.faltantes, function (data) {
                //    //console.log(data);
                //    PedidoService.updatePedido('updatePedido', vm.pedido, function (data) {
                //        toastr.success('Pedido modificado con éxito');
                //        $location.path('/listado_pedidos');
                //        //console.log(data);
                //    })
                //})
            }
        }

        function moverFaltantes() {

            if (vm.faltantes.length < 1) {
                AcUtils.showMessage('error', 'No hay faltantes seleccionados');
                return;
            }

            var btn = document.getElementById("btn-faltantes");
            var btnTop = angular.element(btn).prop('offsetTop');
            var btnLeft = angular.element(btn).prop('offsetLeft');

            var porcH = (btnTop + 35) * 100 / $window.innerHeight;
            var porcW = (btnLeft + 35) * 100 / $window.innerWidth;

            var stylesheet = document.querySelector("link[href='app.css']").sheet;
            var rules = stylesheet.rules;
            //var i = rules.length - 1;
            var keyframes;
            var keyframe;

            for (var i = 0; i < rules.length; i++) {
                keyframe = rules[i];
                if (keyframe.name == 'show-faltantes') {
                    //keyframe.style.cssText = keyframe.style.cssText.replace("circle(0% at 0% 0%);", "circle(0% at 50% 50%);");
                    keyframe.cssRules[0].style.cssText = keyframe.cssRules[0].style.cssText.replace("circle(0% at 0% 0%);", "circle(0% at " + porcW + "% " + porcH + "%);");
                    keyframe.cssRules[2].style.cssText = keyframe.cssRules[2].style.cssText.replace("circle(200% at 0% 0%);", "circle(200% at " + porcW + "% " + porcH + "%);");

                }
                if (keyframe.name == 'ocultar-faltantes') {
                    //keyframe.style.cssText = keyframe.style.cssText.replace("circle(0% at 0% 0%);", "circle(0% at 50% 50%);");
                    keyframe.cssRules[0].style.cssText = keyframe.cssRules[0].style.cssText.replace("circle(200% at 0% 0%);", "circle(200% at " + porcW + "% " + porcH + "%);");
                    keyframe.cssRules[1].style.cssText = keyframe.cssRules[1].style.cssText.replace("circle(0% at 0% 0%);", "circle(0% at " + porcW + "% " + porcH + "%);");

                }
            }


            vm.mostrarMoverFaltantes = true;
            PedidoVars.all = false;
            PedidoService.get(
                function (data) {
                    for (var i = 0; i < data.length; i++) {
                        if (vm.id != data[i].pedido_id) {
                            vm.pedidosActivos.push(data[i]);
                        }
                    }
                }
            );

        }

        //console.log(vm.busqueda.prop('offsetTop'));

    }

    //PedidosService.$inject = ['$http', '$location'];
    //function PedidosService($http, $location) {
    //    var service = {};
    //    service.savePedido = savePedido;
    //    service.updatePedido = updatePedido;
    //    service.getPedidos = getPedidos;
    //    service.getPedidoById = getPedidoById;
    //    service.confirmarPedido = confirmarPedido;
    //    service.getPedidosActivos = getPedidosActivos;
    //    service.deletePedido = deletePedido;
    //    service.deletePedidoDetalles = deletePedidoDetalles;
    //    service.savePedidoDetalles = savePedidoDetalles;
    //
    //    return service;
    //
    //    function getPedidos(callback) {
    //
    //        return $http.post('./stock-api/stock.php',
    //            {function: 'getPedidos'},
    //            {cache: true})
    //            .success(function (data) {
    //
    //                for (var i = 0; i < data.length; i++) {
    //                    for (var x = 0; x < data[i].detalles.length; x++) {
    //                        data[i].detalles[x].precio_unidad = parseFloat(data[i].detalles[x].precio_unidad);
    //                    }
    //                }
    //
    //                callback(data)
    //            })
    //            .error(function (data) {
    //                console.log(data);
    //            });
    //    }
    //
    //    function getPedidoById(id, callback) {
    //
    //        getPedidos(function (data) {
    //            var response = data.filter(function (entry, index, array) {
    //                return entry.pedido_id == id;
    //            })[0];
    //            callback(response);
    //        });
    //
    //    }
    //
    //    function getPedidosActivos(id, callback) {
    //
    //        getPedidos(function (data) {
    //            var response = [];
    //            data.filter(function (entry, index, array) {
    //                if ((entry.fecha_entrega === undefined ||
    //                    entry.fecha_entrega === '' ||
    //                    entry.fecha_entrega === null ||
    //                    entry.fecha_entrega === '0000-00-00 00:00:00') &&
    //                    entry.pedido_id != id) {
    //
    //                    response.push(entry);
    //                }
    //            });
    //            callback(response);
    //        });
    //
    //    }
    //
    //    function savePedido(_function, pedido, callback) {
    //        return $http.post('./stock-api/stock.php',
    //            {function: _function, data: JSON.stringify(pedido)})
    //            .success(function (data) {
    //                callback(data);
    //            })
    //            .error(function (data) {
    //            });
    //    }
    //
    //    function updatePedido(_function, pedido, callback) {
    //        return $http.post('./stock-api/stock.php',
    //            {function: _function, data: JSON.stringify(pedido)})
    //            .success(function (data) {
    //                callback(data);
    //            })
    //            .error(function (data) {
    //            });
    //    }
    //
    //    function deletePedido(pedido_id, callback) {
    //        return $http.post('./stock-api/stock.php',
    //            {function: 'deletePedido', data: pedido_id})
    //            .success(function (data) {
    //                callback(data);
    //            })
    //            .error(function (data) {
    //            });
    //    }
    //
    //    function deletePedidoDetalles(detalles, callback) {
    //        return $http.post('./stock-api/stock.php',
    //            {function: 'deletePedidoDetalles', data: JSON.stringify(detalles)})
    //            .success(function (data) {
    //                callback(data);
    //            })
    //            .error(function (data) {
    //            });
    //    }
    //
    //    function savePedidoDetalles(pedido_id, detalles, callback) {
    //        return $http.post('./stock-api/stock.php',
    //            {function: 'savePedidoDetalles', pedido_id: pedido_id, data: JSON.stringify(detalles)})
    //            .success(function (data) {
    //                callback(data);
    //            })
    //            .error(function (data) {
    //            });
    //    }
    //
    //    function confirmarPedido(_function, pedido, callback) {
    //
    //        //PagoProveedoresPedidoService.pedido = pedido;
    //        //$location.path('/listado_pedidos');
    //
    //        return $http.post('./stock-api/stock.php',
    //            {function: _function, data: JSON.stringify(pedido)})
    //            .success(function (data) {
    //                callback(data);
    //            })
    //            .error(function (data) {
    //            });
    //    }
    //
    //}
})();