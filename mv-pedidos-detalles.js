(function () {

    'use strict';
    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length - 1].src;

    angular.module('mvPedidosDetalles', [])
        .component('mvPedidosDetalles', mvPedidosDetalles());

    function mvPedidosDetalles() {
        return {
            bindings: {
                pedido: '=',
                panel: '='
            },
            templateUrl: window.installPath + '/mv-angular-stocks/mv-pedidos-detalles.html',
            controller: PedidosController
        }
    }


    PedidosController.$inject = ['$routeParams', 'ProductService', 'PedidoService', '$location', '$window',
        'UserService', 'SucursalesService', 'ProductVars', 'PedidoVars', 'MvUtils', '$scope', 'PedidoAdminService'];
    function PedidosController($routeParams, ProductService, PedidoService, $location, $window,
                               UserService, SucursalesService, ProductVars, PedidoVars, MvUtils,
                               $scope, PedidoAdminService) {

        var vm = this;
        vm.isUpdate = false;
        vm.pedido_faltante_id = -1;
        vm.productos = [];
        vm.mostrarMoverFaltantes = false;
        vm.pedidosActivos = [];
        vm.user = {user_id: 1};
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
        vm.busqueda = '';
        vm.sucursales = [];

        //FUNCIONES
        vm.agregarDetalle = agregarDetalle;
        vm.removeDetalle = removeDetalle;
        vm.recalcularTotalDetalle = recalcularTotalDetalle;
        vm.save = save;
        vm.agregarFaltante = agregarFaltante;
        vm.moverFaltantes = moverFaltantes;
        vm.confirmarPedidoFaltante = confirmarPedidoFaltante;
        vm.deletePedido = deletePedido;
        vm.cleanProductos = cleanProductos;
        vm.searchProducto = searchProducto;
        vm.closeForm = closeForm;
        vm.closeFaltante = closeFaltante;

        function searchProducto(callback) {
            ProductService.get().then(callback);
        }

        SucursalesService.get().then(function (data) {
            vm.sucursales = data;
            //return UserService.getByParams('rol_id', '2', 'true');
        }).catch(function(error){
            console.log(error);
        });

        UserService.get(2).then(function (data) {
            vm.proveedores = data;
            vm.pedido.proveedor_id = vm.proveedores[0].proveedor_id;
        }).catch(function(error){
            console.log(error);
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

        $scope.$watch('$ctrl.panel', function () {
            if(vm.panel == undefined)
                vm.panel = 1;
        });

        function closeForm() {
            vm.faltantes = [];
            vm.pedidosActivos = [];
            vm.panel = 1;
            PedidoAdminService.detailsOpen = false;
            PedidoAdminService.broadcast();
        }

        function closeFaltante() {
            vm.panel = 1;
            vm.faltantes = [];
            vm.pedidosActivos = [];
        }


        function cleanProductos() {
            if (vm.pedido.pedidos_detalles.length > 0) {
                var r = confirm('Si cambia el proveedor, todo los productos serán eliminados');
                if (r) {
                    vm.pedido.pedidos_detalles = [];
                }
            }
        }

        function deletePedido() {
            PedidoService.remove(vm.pedido.pedido_id).then(function (data) {
                if(data.status == 200) {
                    MvUtils.showMessage('success', 'Operación realizada con exito');
                    closeForm();
                } else {
                    MvUtils.showMessage('success', 'Error al borrar el pedido.');
                }
            }).catch(function(error){
                console.log(error);
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
                MvUtils.showMessage('error', 'Debe seleccionar un producto');
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

        function save() {
            vm.pedido.usuario_id = UserService.getFromToken().data.id;

            PedidoService.save(vm.pedido).then(function(data){
                if(data.status == 200) {
                    MvUtils.showMessage('success', 'Operación realizada con exito');
                    closeForm();
                }

            }).catch(function(error){
                console.log(error);
            });
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
                PedidoService.create(vm.nuevoPedido).then(function (data) {
                    if(data.status == 200) {
                        PedidoService.update(vm.pedido).then(function (data) {
                            if(data.status == 200) {
                                MvUtils.showMessage('success', 'Pedido creado con exito');
                                closeForm();
                            } else {
                                MvUtils.showMessage('error', 'Error creado pedido faltante');
                            }
                        }).catch(function(error){
                            console.log(error);
                        })
                    } else {
                        MvUtils.showMessage('error', 'Error creado pedido faltante');
                    }
                }).catch(function(error){
                    console.log(error);
                })
            } else {
                PedidoService.getByParams('pedido_id', '' + vm.pedido_faltante_id, 'true').then(function (data) {
                    for (var i = 0; i < data[0].pedidos_detalles.length; i++) {
                        vm.faltantes.push(data[0].pedidos_detalles[i]);
                    }

                    data[0].pedidos_detalles = vm.faltantes;
                    data[0].total = parseFloat(data[0].total) + total_pedido_faltantes;

                    PedidoService.update(data[0]).then(function (data2) {
                        if(data2.status == 200) {
                            PedidoService.update(vm.pedido).then(function (data3) {
                                if(data3.status == 200) {
                                    MvUtils.showMessage('success', 'Pedido modificado con exito');
                                    closeForm();
                                } else {
                                    MvUtils.showMessage('error', 'Error modificando pedido faltante');
                                }
                            }).catch(function(error){
                                console.log(error);
                            });
                        } else {
                            MvUtils.showMessage('error', 'Error modificando pedido faltante');
                        }
                    }).catch(function(error){
                        console.log(error);
                    });

                }).catch(function(error){
                    console.log(error);
                });
            }
        }

        function moverFaltantes() {
            if (vm.faltantes.length < 1) {
                MvUtils.showMessage('error', 'No hay faltantes seleccionados');
                return;
            }
            vm.panel = 2;

            PedidoVars.all = false;
            PedidoService.get().then(function (data) {
                for (var i = 0; i < data.length; i++) {
                    if (vm.pedido.pedido_id != data[i].pedido_id) {
                        vm.pedidosActivos.push(data[i]);
                    }
                }
            }).catch(function(error){
                console.log(error);
            });
        }
    }


})();