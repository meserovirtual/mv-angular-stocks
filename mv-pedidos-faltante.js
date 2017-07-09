(function () {

  'use strict';
  var scripts = document.getElementsByTagName("script");
  var currentScriptPath = scripts[scripts.length - 1].src;

  angular.module('mvPedidosFaltantes', [])
    .component('mvPedidosFaltantes', mvPedidosFaltantes());

  function mvPedidosFaltantes() {
    return {
      bindings: {
        faltantes: '='
      },
      templateUrl: window.installPath + '/mv-angular-stocks/mv-pedidos-faltante.html',
      controller: PedidosFaltanteController
    }
  }


  PedidosFaltanteController.$inject = ['$scope', 'PedidoService', 'PedidoVars', '$location', 'MvUtils', 'PedidoAdminService'];
  function PedidosFaltanteController($scope, PedidoService, PedidoVars, $location, MvUtils, PedidoAdminService) {

    var vm = this;

    vm.pedido_faltante_id = -1;
    vm.user = {user_id: 1};
    //vm.faltantes = [];
    vm.pedidosActivos = [];
    vm.pedidoFaltante = [];
    vm.pedido = {};

    //FUNCIONES
    vm.closeForm = closeForm;
    vm.confirmarPedidoFaltante = confirmarPedidoFaltante;

    $scope.$watch('$ctrl.faltantes', function () {
      console.log(vm.faltantes);
        if (vm.faltantes != undefined) {
          console.log('faltantes');
      }
    });


    moverFaltantes();

    function closeForm() {
      PedidoAdminService.detailsOpen = true;
      PedidoAdminService.showDetalle = true;
      PedidoAdminService.broadcast();
    }

    function moverFaltantes() {
      console.log('cargar pedidos');
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
    }


    function confirmarPedidoFaltante() {

      console.log(vm.faltantes);

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
        console.log(vm.nuevoPedido);

        PedidoService.create(vm.nuevoPedido).then(function (data) {
          console.log(data);
          console.log(vm.pedido);

          PedidoService.update(vm.pedido).then(function (data) {
            MvUtils.showMessage('success', 'Pedido creado con éxito');
            $location.path('/reportes/pedidos');
            console.log(data);
          }).catch(function(error){
            console.log(error);
          })
        }).catch(function(error){
          console.log(error);
        })
      } else {

        PedidoService.getByParams('pedido_id', '' + vm.pedido_faltante_id, 'true').then(function (data) {

          console.log(data);

          for (var i = 0; i < data[0].pedidos_detalles.length; i++) {
            vm.faltantes.push(data[0].pedidos_detalles[i]);
          }

          data[0].pedidos_detalles = vm.faltantes;
          data[0].total = parseFloat(data[0].total) + total_pedido_faltantes;

          PedidoService.update(data[0]).then(function (data) {
            PedidoService.update(vm.pedido).then(function (data) {
              MvUtils.showMessage('success', 'Pedido modificado con �xito');
              $location.path('/reportes/pedidos');
              console.log(data);
            }).catch(function(error){
              console.log(error);
            });
          }).catch(function(error){
            console.log(error);
          });
          
        }).catch(function(error){
          console.log(error);
        });


        //PedidoService.savePedidoDetalles(vm.pedido_faltante_id, vm.faltantes, function (data) {
        //    //console.log(data);
        //    PedidoService.updatePedido('updatePedido', vm.pedido, function (data) {
        //        toastr.success('Pedido modificado con �xito');
        //        $location.path('/listado_pedidos');
        //        //console.log(data);
        //    })
        //})
      }
    }



  }


})();