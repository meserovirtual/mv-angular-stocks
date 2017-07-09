(function () {

    'use strict';
    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length - 1].src;

    angular.module('mvPedidosDetalles', [])
        .component('mvPedidosDetalles', mvPedidosDetalles());

    function mvPedidosDetalles() {
        return {
            bindings: {
                pedido: '='
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
        vm.id = $routeParams.id;
        vm.pedido_faltante_id = -1;
        vm.productos = [];
        vm.showDetalle = true;
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

        //FUNCIONES
        //vm.mostrarPanel = mostrarPanel;
        //vm.selectProducto = selectProducto;
        vm.agregarDetalle = agregarDetalle;
        vm.removeDetalle = removeDetalle;
        vm.recalcularTotalDetalle = recalcularTotalDetalle;
        vm.save = save;
        //vm.confirmar = confirmar;
        vm.agregarFaltante = agregarFaltante;
        vm.moverFaltantes = moverFaltantes;
        //vm.confirmarPedidoFaltante = confirmarPedidoFaltante;
        vm.deletePedido = deletePedido;
        vm.cleanProductos = cleanProductos;
        vm.searchProducto = searchProducto;
        vm.closeForm = closeForm;

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

        PedidoAdminService.listen(function () {
            vm.showDetalle = PedidoAdminService.showDetalle;
        });

        function closeForm() {
            PedidoAdminService.detailsOpen = false;
            PedidoAdminService.broadcast();
        }

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
            if (vm.pedido.pedidos_detalles.length > 0) {
                var r = confirm('Si cambia el proveedor, todo los productos serán eliminados');
                if (r) {
                    vm.pedido.pedidos_detalles = [];
                }
            }
        }

        function deletePedido() {
            PedidoService.remove(vm.id,
                function (data) {
                    if (data > 0) {
                        MvUtils.showMessage('success', 'Pedido borrado con éxito.');
                        $location.path('/caja/cobros');
                    } else {
                        MvUtils.showMessage('success', 'Error al borrar el pedido.');
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

            PedidoService.save(vm.pedido).then(function(data){
                console.log(data);
                if(data.status == 200) {
                    MvUtils.showMessage('success', 'Operación realizada con exito');
                    closeForm();
                }

            }).catch(function(error){
                console.log(error);
            });
            /*
             if (vm.pedido.pedido_id != undefined && vm.pedido.pedido_id != -1) {
             PedidoService.update(vm.pedido,
             function (data) {

             if (data != -1) {
             MvUtils.showMessage('success', 'Pedido modificado con �xito.');
             $location.path('/caja/cobros');

             } else {
             MvUtils.showMessage('success', 'Error al modificar el pedido.');
             }
             ProductVars.clearCache = true;
             ProductService.get(function (data) {
             });
             });
             } else {
             PedidoService.create(vm.pedido,
             function (data) {

             if (data !== -1) {
             MvUtils.showMessage('success', 'Pedido generado con éxito.');
             $location.path('/caja/cobros');
             } else {
             MvUtils.showMessage('success', 'Error al generar el pedido.');
             }
             ProductVars.clearCache = true;
             ProductService.get(function (data) {
             });
             });
             }
             */
        }

        function agregarFaltante(detalle) {
            console.log(detalle);
            console.log(vm.faltantes);
            var existe = false;
            for (var i = 0; i < vm.faltantes.length; i++) {
                console.log(vm.faltantes);
                if (detalle === vm.faltantes[i]) {
                    existe = true;
                    //vm.faltantes.splice(i, 1);
                }
            }
            console.log(existe);
            if (!existe) {
                vm.faltantes.push(detalle);
            }
            console.log(vm.faltantes);
        }




        function moverFaltantes() {

            if (vm.faltantes.length < 1) {
                MvUtils.showMessage('error', 'No hay faltantes seleccionados');
                return;
            }

            vm.showDetalle = false;

            /*
            PedidoVars.all = false;
            PedidoService.get().then(function (data) {
                for (var i = 0; i < data.length; i++) {
                    if (vm.id != data[i].pedido_id) {
                        vm.pedidosActivos.push(data[i]);
                    }
                }
                console.log(vm.pedidosActivos);
            }).catch(function(error){
                console.log(error);
            });
            */
        }

    }


})();