<?php
/* TODO:
 * */


session_start();

if (file_exists('../../../includes/MyDBi.php')) {
    require_once '../../../includes/MyDBi.php';
    require_once '../../../includes/utils.php';
} else {
    require_once 'MyDBi.php';
}


class Stocks extends Main
{
    private static $instance;

    public static function init($decoded)
    {
        self::$instance = new Main(get_class(), $decoded['function']);
        try {
            call_user_func(get_class() . '::' . $decoded['function'], $decoded);
        } catch (Exception $e) {

            $file = 'error.log';
            $current = file_get_contents($file);
            $current .= date('Y-m-d H:i:s') . ": " . $e . "\n";
            file_put_contents($file, $current);

            header('HTTP/1.0 500 Internal Server Error');
            echo $e;
        }
    }


    function getAReponer($params)
    {

        $db = self::$instance->db;

        $SQL = 'SELECT
                  p.producto_id,
	              SUM(s.cant_actual) cant_actual,
	              p.pto_repo,
	              p.nombre
              FROM productos p
              INNER JOIN stock s ON p.producto_id = s.producto_id
              WHERE p.status = 1 and s.sucursal_id = ' . $params["sucursal_id"] . ' and s.empresa_id = ' . getEmpresa() . ' 
              GROUP BY p.producto_id, p.pto_repo
              HAVING p.pto_repo >= SUM(s.cant_actual)
              ORDER BY p.nombre, SUM(s.cant_actual);';

        $results = $db->rawQuery($SQL);

        echo json_encode($results);
    }


    /**
     * @descr Obtiene los pedidos. En caso de enviar un usuario_id != -1, se traerán todos los stocks. Solo usar esta opción cuando se aplica en la parte de administración
     * @param $params
     */
    function getStocks($params)
    {
        $db = self::$instance->db;
        //    $results = $db->get('pedidos');

        $SQL = 'SELECT
    p.producto_id,
    p.nombre,
    p.sku,
    p.producto_tipo_id,
    p.iva,
    p.pto_repo,
    pr.precio_id,
    pr.precio_tipo_id,
    pr.precio,
    su.sucursal_id,
    su.nombre nombreSucursal,
    st.stock_id,
    st.cant_actual,
    st.costo_uni,
    st.proveedor_id,
    ki.producto_id producto_kit_id,
    u.nombre nombreProveedor,
    u.apellido apellidoProveedor
FROM
    productos p
        LEFT JOIN
    precios pr ON p.producto_id = pr.producto_id
        LEFT JOIN
    stock st ON st.producto_id = p.producto_id
        LEFT JOIN
    sucursales su ON su.sucursal_id = st.sucursal_id
        LEFT JOIN
    productos_kits ki ON ki.parent_id = p.producto_id
        LEFT JOIN
    usuarios u ON u.usuario_id = st.proveedor_id
WHERE st.empresa_id = ' . getEmpresa() .' and ' . (($params['sucursal_id'] != -1) ? ' st.sucursal_id = ' . $params['sucursal_id'] : ' st.sucursal_id != -1') . ';';
//(((p.producto_tipo_id = 0  AND st.cant_actual > 0) ) ' . (($params['sucursal_id'] != -1) ? ' and st.sucursal_id=' . $params['sucursal_id'] : '') . ') or (p.producto_tipo_id = 3) OR (p.producto_tipo_id = 2);';


        $results = $db->rawQuery($SQL);


        $final = array();
        foreach ($results as $row) {

            if (!isset($final[$row["producto_id"]])) {
                $final[$row["producto_id"]] = array(
                    'producto_id' => $row["producto_id"],
                    'nombre' => $row["nombre"],
                    'sku' => $row["sku"],
                    'producto_tipo_id' => $row["producto_tipo_id"],
                    'iva' => $row["iva"],
                    'pto_repo' => $row["pto_repo"],
                    'proveedor_id' => $row["proveedor_id"],
                    'nombreProveedor' => $row["nombreProveedor"],
                    'apellidoProveedor' => $row["apellidoProveedor"],
                    'stocks' => array(),
                    'precios' => array(),
                    'kits' => array()
                );
            }


            $have_pre = false;
            if ($row["precio_id"] !== null) {

                if (sizeof($final[$row['producto_id']]['precios']) > 0) {
                    foreach ($final[$row['producto_id']]['precios'] as $cat) {
                        if ($cat['precio_id'] == $row["precio_id"]) {
                            $have_pre = true;
                        }
                    }
                } else {
                    $final[$row['producto_id']]['precios'][] = array(
                        'precio_id' => $row['precio_id'],
                        'precio_tipo_id' => $row['precio_tipo_id'],
                        'precio' => $row['precio']
                    );

                    $have_pre = true;
                }

                if (!$have_pre) {
                    array_push($final[$row['producto_id']]['precios'], array(
                        'precio_id' => $row['precio_id'],
                        'precio_tipo_id' => $row['precio_tipo_id'],
                        'precio' => $row['precio']
                    ));
                }
            }


            $have_kit = false;
            if ($row["producto_kit_id"] !== null) {

                if (sizeof($final[$row['producto_id']]['kits']) > 0) {
                    foreach ($final[$row['producto_id']]['kits'] as $cat) {
                        if ($cat['producto_kit_id'] == $row["producto_kit_id"]) {
                            $have_kit = true;
                        }
                    }
                } else {
                    $final[$row['producto_id']]['kits'][] = array(
                        'producto_kit_id' => $row['producto_kit_id']
                    );

                    $have_kit = true;
                }

                if (!$have_kit) {
                    array_push($final[$row['producto_id']]['kits'], array(
                        'producto_kit_id' => $row['producto_kit_id']
                    ));
                }
            }

            $have_sto = false;
            if ($row["stock_id"] !== null) {

                if (sizeof($final[$row['producto_id']]['stocks']) > 0) {
                    foreach ($final[$row['producto_id']]['stocks'] as $cat) {
                        if ($cat['stock_id'] == $row["stock_id"]) {
                            $have_sto = true;
                        }
                    }
                } else {
                    $final[$row['producto_id']]['stocks'][] = array(
                        'stock_id' => $row['stock_id'],
                        'sucursal_id' => $row['sucursal_id'],
                        'nombreSucursal' => $row['nombreSucursal'],
                        'cant_actual' => $row['cant_actual'],
                        'costo_uni' => $row['costo_uni']
                    );

                    $have_sto = true;
                }

                if (!$have_sto) {
                    array_push($final[$row['producto_id']]['stocks'], array(
                        'stock_id' => $row['stock_id'],
                        'sucursal_id' => $row['sucursal_id'],
                        'nombreSucursal' => $row['nombreSucursal'],
                        'cant_actual' => $row['cant_actual'],
                        'costo_uni' => $row['costo_uni']
                    ));
                }
            }


        }
        echo json_encode(array_values($final));


    }



/////// INSERT ////////

    /**Crea un pedido con fecha de entrega "vacia" = 0000-00-00 00:00:00
     * @param $pedido
     */
    function createPedido($params)
    {
        $db = self::$instance->db;
        $db->startTransaction();
        $item_decoded = self::checkPedido(json_decode($params['pedido']));

        $data = array(
            'proveedor_id' => $item_decoded->proveedor_id,
            'usuario_id' => $item_decoded->usuario_id,
            'total' => $item_decoded->total,
            'iva' => $item_decoded->iva,
            'sucursal_id' => $item_decoded->sucursal_id,
            'empresa_id' => getEmpresa()
        );

        $result = $db->insert('pedidos', $data);
        if ($result > -1) {
            foreach ($item_decoded->pedidos_detalles as $pedido_detalle) {
                $subitem_decoded = self::checkPedidodetalle($pedido_detalle);

                $data = array(
                    'pedido_id' => $result,
                    'producto_id' => $subitem_decoded->producto_id,
                    'cantidad' => $subitem_decoded->cantidad,
                    'precio_unidad' => $subitem_decoded->precio_unidad,
                    'precio_total' => $subitem_decoded->precio_total
                );

                $ped = $db->insert('pedidos_detalles', $data);
                if ($ped > -1) {
                } else {
                    $db->rollback();
                    header('HTTP/1.0 500 Internal Server Error');
                    echo json_encode($db->getLastError());
                    return;
                }
            }

            $db->commit();
            header('HTTP/1.0 200 Ok');
            echo json_encode($result);
        } else {
            $db->rollback();
            header('HTTP/1.0 500 Internal Server Error');
            echo json_encode($db->getLastError());
        }
    }


    /**Crea una entrada de stock por producto.
     * @param $stock
     * @param $db
     */
    function createStock($params)
    {

        $stock_list = json_decode($params['stock']);
        $db = self::$instance->db;
        $db->startTransaction();
        foreach ($stock_list as $stock) {
            $item_decoded = self::checkStock($stock);

            $data = array(
                'producto_id' => $item_decoded->producto_id,
                'proveedor_id' => $item_decoded->proveedor_id,
                'sucursal_id' => $item_decoded->sucursal_id,
                'cant_actual' => $item_decoded->cant_actual,
                'cant_inicial' => $item_decoded->cant_inicial,
                'costo_uni' => $item_decoded->precio_unidad,
                'empresa_id' => getEmpresa()
            );

            $result = $db->insert('stock', $data);

            if ($result > -1) {

            } else {
                $db->rollback();
                header('HTTP/1.0 500 Internal Server Error');
                echo json_encode($db->getLastError());
                return;
            }
        }
        $db->commit();
        header('HTTP/1.0 200 Ok');
        echo json_encode($result);
    }


    /**
     * @description Crea un detalle de pedido
     * @param $pedido_detalle
     */
    function createPedidoDetalle($pedido_detalle)
    {
        $db = self::$instance->db;
        $db->startTransaction();
        $item_decoded = self::checkPedidodetalle(json_decode($pedido_detalle));

        $data = array(
            'pedido_id' => $item_decoded->pedido_id,
            'producto_id' => $item_decoded->producto_id,
            'cantidad' => $item_decoded->cantidad,
            'precio_unidad' => $item_decoded->precio_unidad,
            'precio_total' => $item_decoded->precio_total
        );

        $result = $db->insert('pedidos_detalles', $data);
        if ($result > -1) {
            $db->commit();
            echo json_encode($result);
        } else {
            $db->rollback();
            header('HTTP/1.0 500 Internal Server Error');
            echo json_encode($db->getLastError());
        }
    }

/////// UPDATE ////////

    /**
     * @description Modifica un pedido
     * @param $product
     */
    function updatePedido($params)
    {
        $db = self::$instance->db;
        $db->startTransaction();
        $item_decoded = self::checkPedido(json_decode($params['pedido']));

        $db->where('pedido_id', $item_decoded->pedido_id);
        $data = array(
            'proveedor_id' => $item_decoded->proveedor_id,
            'usuario_id' => $item_decoded->usuario_id,
            'fecha_entrega' => $item_decoded->fecha_entrega != '0000-00-00 00:00:00' ? $db->now() : $item_decoded->fecha_entrega,
            'total' => $item_decoded->total,
            'iva' => $item_decoded->iva,
            'sucursal_id' => $item_decoded->sucursal_id
        );

        $result = $db->update('pedidos', $data);


        if ($result) {
            $db->where('pedido_id', $item_decoded->pedido_id);
            $db->delete('pedidos_detalles');
            foreach ($item_decoded->pedidos_detalles as $pedido_detalle) {
                $subitem_decoded = self::checkPedidodetalle($pedido_detalle);

                $data = array(
                    'pedido_id' => $item_decoded->pedido_id,
                    'producto_id' => $subitem_decoded->producto_id,
                    'cantidad' => $subitem_decoded->cantidad,
                    'precio_unidad' => $subitem_decoded->precio_unidad,
                    'precio_total' => $subitem_decoded->precio_total
                );

                $result = $db->insert('pedidos_detalles', $data);
                if ($result > -1) {
                } else {
                    $db->rollback();
                    header('HTTP/1.0 500 Internal Server Error');
                    echo json_encode($db->getLastError());
                    return;
                }

            }
            $db->commit();
            header('HTTP/1.0 200 Ok');
            echo json_encode($result);
        } else {
            $db->rollback();
            header('HTTP/1.0 500 Internal Server Error');
            echo json_encode($db->getLastError());
        }
    }

    /**
     * @description Modifica un detalle de pedido
     * @param $pedido_detalle
     */
    function updatePedidoDetalle($pedido_detalle)
    {
        $db = new MysqliDb();
        $db->startTransaction();
        $item_decoded = checkPedidoDetalle(json_decode($pedido_detalle));
        $db->where('pedido_detalle_id', $item_decoded->pedido_detalle_id);
        $data = array(
            'pedido_id' => $item_decoded->pedido_id,
            'producto_id' => $item_decoded->producto_id,
            'cantidad' => $item_decoded->cantidad,
            'precio_unidad' => $item_decoded->precio_unidad,
            'precio_total' => $item_decoded->precio_total
        );

        $result = $db->update('pedido_detalles', $data);
        if ($result) {
            $db->commit();
            echo json_encode($result);
        } else {
            $db->rollback();
            echo json_encode(-1);
        }
    }


    /**
     * @description Modifica un stock
     * @param $stock
     */
    function updateStock($stock)
    {
        $db = self::$instance->db;
        $db->startTransaction();
        $item_decoded = json_decode($stock['stock']);

        foreach ($item_decoded as $row) {
            if ($row->stock_id < 1 || is_nan($row->stock_id)) {
                header('HTTP/1.0 500 Internal Server Error');
                $db->rollback();
                echo json_encode(-1);
            }


            $db->where('stock_id', $row->stock_id);
            $data = array('cant_actual' => $row->cant_actual);

            $result = $db->update('stock', $data);
        }


        if ($result) {

            $db->commit();
            header('HTTP/1.0 200 Ok');
            echo json_encode($result);
        } else {
            $db->rollback();
            header('HTTP/1.0 500 Internal Server Error');
            echo $db->getLastError();
        }
    }

/////// REMOVE ////////

    /**
     * @description Elimina un pedido
     * @param $pedido_id
     */
    function removePedido($params)
    {
        $db = self::$instance->db;

        $db->where("pedido_id", $params['pedido_id']);
        $results = $db->delete('pedidos');

        $db->where("pedido_id", $params['pedido_id']);
        $db->delete('pedidos_detalles');

        if ($results) {
            echo json_encode(1);
        } else {
            echo json_encode(-1);
        }
    }


    /**
     * @description Elimina una detalle de pedido
     * @param $pedidodetalle_id
     */
    function removePedidoDetalle($params)
    {
        $db = self::$instance->db;

        $db->where("pedido_detalle_id", $params['pedido_detalle_id']);
        $results = $db->delete('pedidos_detalles');

        if ($results) {
            echo json_encode(1);
        } else {
            echo json_encode(-1);
        }
    }

    /**
     * @description Elimina un stock
     * @param $stock_id
     */
    function removeStock($params)
    {
        $db = self::$instance->db;

        $db->where("stock_id", $params['stock_id']);
        $results = $db->delete('stock');

        if ($results) {
            echo json_encode(1);
        } else {
            echo json_encode(-1);
        }
    }


/////// GET ////////

    /**
     * @descr Obtiene los pedidos
     * @param $all si debe traer solo los activo o todos, por defecto, solo los activos
     */
    function getPedidos($params)
    {
        $db = self::$instance->db;

//    $results = $db->get('pedidos');

        $SQL = 'SELECT
    p.pedido_id,
    p.proveedor_id,
    p.usuario_id,
    p.fecha_pedido,
    p.fecha_entrega,
    p.total,
    p.iva,
    p.sucursal_id,
    pr.nombre nombreProveedor,
    pr.apellido apellidoProveedor,
    u.nombre nombreUsuario,
    u.apellido apellidoUsuario,
    pd.pedido_detalle_id,
    pd.producto_id,
    pd.cantidad,
    pd.precio_unidad,
    pd.precio_total,
    o.nombre nombreProducto
FROM
    pedidos p
        INNER JOIN
    usuarios u ON p.usuario_id = u.usuario_id
        INNER JOIN
    usuarios pr ON p.proveedor_id = pr.usuario_id
        LEFT JOIN
    pedidos_detalles pd ON pd.pedido_id = p.pedido_id
        INNER JOIN
    productos o ON o.producto_id = pd.producto_id ' .
            (($params['all'] == 'false') ? 'WHERE p.fecha_entrega = "0000-00-00 00:00:00" and p.empresa_id = ' . getEmpresa()  : ' WHERE p.empresa_id = ' . getEmpresa() )
            . '
            GROUP BY p.pedido_id,
    p.proveedor_id,
    p.usuario_id,
    p.fecha_pedido,
    p.fecha_entrega,
    p.total,
    p.iva,
    p.sucursal_id,
    pr.nombre,
    pr.apellido,
    u.nombre,
    u.apellido,
    pd.pedido_detalle_id,
    pd.producto_id,
    pd.cantidad,
    pd.precio_unidad,
    pd.precio_total,
    o.nombre
    ORDER BY p.pedido_id desc;';

        $results = $db->rawQuery($SQL);


        $final = array();
        foreach ($results as $row) {

            if (!isset($final[$row["pedido_id"]])) {
                $final[$row["pedido_id"]] = array(
                    'pedido_id' => $row["pedido_id"],
                    'proveedor_id' => $row["proveedor_id"],
                    'usuario_id' => $row["usuario_id"],
                    'fecha_pedido' => $row["fecha_pedido"],
                    'fecha_entrega' => $row["fecha_entrega"],
                    'total' => $row["total"],
                    'iva' => $row["iva"],
                    'sucursal_id' => $row["sucursal_id"],
                    'proveedor_nombre' => $row["nombreProveedor"],
                    'proveedor_apellido' => $row["apellidoProveedor"],
                    'usuario_nombre' => $row["nombreUsuario"],
                    'usuario_apellido' => $row["apellidoUsuario"],
                    'pedidos_detalles' => array()
                );
            }
            $have_pde = false;
            if ($row["pedido_detalle_id"] !== null) {

                if (sizeof($final[$row['pedido_id']]['pedidos_detalles']) > 0) {
                    foreach ($final[$row['pedido_id']]['pedidos_detalles'] as $pde) {
                        if ($pde['pedido_detalle_id'] == $row["pedido_detalle_id"]) {
                            $have_pde = true;
                        }
                    }
                } else {
                    $final[$row['pedido_id']]['pedidos_detalles'][] = array(
                        'pedido_detalle_id' => $row['pedido_detalle_id'],
                        'producto_id' => $row['producto_id'],
                        'cantidad' => $row['cantidad'],
                        'precio_unidad' => $row['precio_unidad'],
                        'precio_total' => $row['precio_total'],
                        'nombre' => $row['nombreProducto']
                    );

                    $have_pde = true;
                }

                if (!$have_pde) {
                    array_push($final[$row['pedido_id']]['pedidos_detalles'], array(
                        'pedido_detalle_id' => $row['pedido_detalle_id'],
                        'producto_id' => $row['producto_id'],
                        'cantidad' => $row['cantidad'],
                        'precio_unidad' => $row['precio_unidad'],
                        'precio_total' => $row['precio_total'],
                        'nombre' => $row['nombreProducto']
                    ));
                }
            }


        }
        echo json_encode(array_values($final));
    }


    /**
     * @descr Obtiene las pedidodetalles
     */
    function getPedidosDetalles($pedido_id)
    {
        $db = new MysqliDb();
        $db->where('pedido_id', $pedido_id);
        $results = $db->get('pedidos_detalles');

        echo json_encode($results);
    }


    /**
     * @description Verifica todos los campos de pedido para que existan
     * @param $pedido
     * @return mixed
     */
    function checkPedido($pedido)
    {


        $pedido->proveedor_id = (!array_key_exists("proveedor_id", $pedido)) ? -1 : $pedido->proveedor_id;
        $pedido->usuario_id = (!array_key_exists("usuario_id", $pedido)) ? -1 : $pedido->usuario_id;
        $pedido->fecha_pedido = (!array_key_exists("fecha_pedido", $pedido)) ? '' : $pedido->fecha_pedido;
        $pedido->fecha_entrega = (!array_key_exists("fecha_entrega", $pedido)) ? '0000 - 00 - 00 00:00:00' : $pedido->fecha_entrega;
        $pedido->total = (!array_key_exists("total", $pedido)) ? 1 : $pedido->total;
        $pedido->iva = (!array_key_exists("iva", $pedido)) ? 0.0 : $pedido->iva;
        $pedido->sucursal_id = (!array_key_exists("sucursal_id", $pedido)) ? 1 : $pedido->sucursal_id;

        return $pedido;
    }


    /**
     * @description Verifica todos los campos de pedidodetalle para que existan
     * @param $pedido_detalle
     * @return mixed
     */
    function checkPedidoDetalle($pedido_detalle)
    {
        $pedido_detalle->pedido_id = (!array_key_exists("pedido_id", $pedido_detalle)) ? -1 : $pedido_detalle->pedido_id;
        $pedido_detalle->producto_id = (!array_key_exists("producto_id", $pedido_detalle)) ? -1 : $pedido_detalle->producto_id;
        $pedido_detalle->cantidad = (!array_key_exists("cantidad", $pedido_detalle)) ? 0 : $pedido_detalle->cantidad;
        $pedido_detalle->precio_unidad = (!array_key_exists("precio_unidad", $pedido_detalle)) ? 0.0 : $pedido_detalle->precio_unidad;
        $pedido_detalle->precio_total = (!array_key_exists("precio_total", $pedido_detalle)) ? 0.0 : $pedido_detalle->precio_total;
        return $pedido_detalle;
    }

    /**
     * @description Verifica todos los campos de stock para que existan
     * @param $stock
     * @return mixed
     */
    function checkStock($stock)
    {
        $stock->proveedor_id = (!array_key_exists("proveedor_id", $stock)) ? -1 : $stock->proveedor_id;
        $stock->producto_id = (!array_key_exists("producto_id", $stock)) ? -1 : $stock->producto_id;
        $stock->sucursal_id = (!array_key_exists("sucursal_id", $stock)) ? 0 : $stock->sucursal_id;
        $stock->cant_actual = (!array_key_exists("cant_actual", $stock)) ? 0.0 : $stock->cant_actual;
        $stock->cant_inicial = (!array_key_exists("cant_inicial", $stock)) ? 0.0 : $stock->cant_inicial;
        $stock->costo_uni = (!array_key_exists("costo_uni", $stock)) ? 0.0 : $stock->costo_uni;

        return $stock;
    }

    /**
     * @description Mueve una determinada cantidad de un producto a otra sucursal
     * @param $origen_id
     * @param $destino_id
     * @param $producto_id
     * @param $cantidad
     */
    function trasladar($params)
    {
        $db = self::$instance->db;

        $elems = json_decode($params['detalles']);
        foreach ($elems as $item) {
            $cant_a_mover = $item->cantidad;

            $stock_origen = $db->rawQuery('select stock_id, cant_actual, costo_uni, proveedor_id from stock where sucursal_id = ' . $item->origen_id . '
and producto_id = ' . $item->producto_id . ' order by stock_id asc');
            foreach ($stock_origen as $row) {

                if ($cant_a_mover > 0 && $row["cant_actual"] > 0) {
                    if ($row["cant_actual"] < $cant_a_mover) {
                        $db->where('stock_id', $row['stock_id']);
                        $data = array('cant_actual' => 0);
                        $db->update('stock', $data);

                        $insertar = array('producto_id' => $item->producto_id,
                            'proveedor_id' => $row['proveedor_id'],
                            'sucursal_id' => $item->destino_id,
                            'cant_actual' => $row["cant_actual"],
                            'cant_inicial' => $row["cant_actual"],
                            'costo_uni' => $row['costo_uni']
                        );
                        $db->insert('stock', $insertar);

                        $cant_a_mover = $cant_a_mover - $row["cant_actual"];
                    } else if ($row["cant_actual"] > $cant_a_mover) {

                        $db->where('stock_id', $row['stock_id']);
                        $data = array('cant_actual' => $row["cant_actual"] - $cant_a_mover);
                        $db->update('stock', $data);

                        $insertar = array('producto_id' => $item->producto_id,
                            'proveedor_id' => $row['proveedor_id'],
                            'sucursal_id' => $item->destino_id,
                            'cant_actual' => $cant_a_mover,
                            'cant_inicial' => $cant_a_mover,
                            'costo_uni' => $row['costo_uni']
                        );
                        $db->insert('stock', $insertar);

                        $cant_a_mover = 0;

                    } else if ($row["cant_actual"] == $cant_a_mover) {

                        $db->where('stock_id', $row['stock_id']);
                        $data = array('cant_actual' => 0);
                        $db->update('stock', $data);

                        $insertar = array('producto_id' => $item->producto_id,
                            'proveedor_id' => $row['proveedor_id'],
                            'sucursal_id' => $item->destino_id,
                            'cant_actual' => $cant_a_mover,
                            'cant_inicial' => $cant_a_mover,
                            'costo_uni' => $row['costo_uni']
                        );
                        $db->insert('stock', $insertar);

                        $cant_a_mover = 0;
                    }
                }
            }
        }
        header('HTTP/1.0 200 Ok');
        echo json_encode($db->getLastError());
    }
}


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = file_get_contents("php://input");
    $decoded = json_decode($data);
    Stocks::init(json_decode(json_encode($decoded), true));
} else {
    Stocks::init($_GET);
}


