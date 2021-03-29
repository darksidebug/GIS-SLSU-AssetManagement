<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class User extends CI_Controller {

    public function __construct(){

        parent::__construct();
        $this->load->library('session');
        $this->load->model('UserModel', 'user_model');
    }

    public function sign_in(){

        if(isset($_POST['action']) && $_POST['action'] == 'sign-in')
        {
            $email    = $this->input->post('user');
            $password = $this->input->post('pass');

            $return_result = $this->user_model->sign_in('user_table', $email, $password);

            if($return_result['result'] == TRUE){

                $session = array(
                    'logged_in' => $return_result['result'],
                    'user_type' => $return_result['user_type']
                );
                $this->session->set_userdata($session);

                $user_data = array(
                    'login'      => true,
                    'user_type'  => $return_result['user_type'],
                    'message'    => 'Welcome!. You are now logged in successfully.',
                    'user_email' => $return_result['user_email']
                );

                echo json_encode($user_data);
            }
            else{
                $user_data = array(
                    'login'      => false,
                    'user_type'  => $return_result['user_type'],
                    'message'    => "Sorry! No such user exists. Username or Password invalid!",
                    'user_email' => $return_result['user_email']
                );
                echo json_encode($user_data);
            }
        }
        else{

            redirect('page/form/sign-in');
        }
    }

    public function sign_up(){

        if(isset($_POST['action']) && $_POST['action'] == 'sign-up'){

            $email    = $this->input->post('email');
            $password = $this->input->post('pass');
            $type     = $this->input->post('type');

            $user_type = ($type == 1 ? 'Super_Admin' : 'Guest');

            $return_result = $this->user_model->sign_up('user_table', $email, $password, $user_type);
            if($return_result['result'] == TRUE){

                $session = array(
                    'logged_in' => $return_result['result'],
                    'user_type' => $user_type
                );
                $this->session->set_userdata($session);

                $user_data = array(
                    'insert'     => true,
                    'user_type'  => $return_result['user_type'],
                    'message'    => 'Welcome!. You are now logged in successfully.',
                    'user_email' => $return_result['user_email']
                );

                echo json_encode($user_data);
            }
            else{
                $user_data = array(
                    'insert'     => false,
                    'user_type'  => $return_result['user_type'],
                    'message'    => "Sorry! No such user exists. Username or Password invalid!",
                    'user_email' => $return_result['user_email']
                );
                echo json_encode($user_data);
            }
        }
        else{

            redirect('page/form/sign-up');
        }
    }

    public function get_assets(){
        
        if(isset($_POST['search_val']) && !empty($_POST['search_val'])){

            $building_name = $this->input->post('search_val');
            $return_result = $this->user_model->get_assets($building_name);
            if($return_result['result'] == TRUE)
            {
                echo json_encode($return_result['value']);
            }
        }
        else{

            redirect('page/view/home');
        }
        
    }

    public function get_bldg()
    {
        if(isset($_POST['get']) && $_POST['get'] == 'bldg'){

            $return_result = $this->user_model->get_bldg();
            if($return_result['result'] == TRUE)
            {
                echo json_encode($return_result['value']);
            }
        }
        else{

            redirect('page/view/home');
        }
    }

    public function get_rooms()
    {
        if(isset($_POST['get']) && $_POST['get'] == 'rooms'){

            $building_name = $this->input->post('value');
            $return_result = $this->user_model->get_rooms($building_name);
            if($return_result['result'] == TRUE)
            {
                echo json_encode($return_result['value']);
            }
        }
        else{

            redirect('page/view/home');
        }
    }

    public function store_data_assets()
    {
        if(isset($_POST['action']) && $_POST['action'] == 'insert_assets'){

            $return_result = $this->user_model->get_building($this->input->post('bldg_name'));
            if($return_result['result'] == TRUE){

                foreach ($return_result['value'] as $key => $value){

                    $bldg_id = $value->id;
                }

                $room_result = $this->user_model->get_room($this->input->post('rooms_offices'));
                if($room_result['result'] == TRUE){

                    $user_data = array(
                        'insert'  => false,
                        'message' => "Room/Office already added associated with its assets. If you wish to add or update assets click 'VIEW ASSETS' button"
                    );
                    echo json_encode($user_data);
                }
                else{

                    $data_for_rooms_tbl = array(
                        'bldg_id' => $bldg_id,
                        'rooms'   => $this->input->post('rooms_offices')
                    );
                    $insert_room_result = $this->user_model->insert('rooms', $data_for_rooms_tbl);
                    if($insert_room_result['result'] == TRUE){

                        for ($i = 0; $i < count($this->input->post('serial')); $i++) {

                            $data_for_assets_tbl = array(
                                'room_id'       => $insert_room_result['value'],
                                'serial_no'     => $this->input->post('serial')[$i],
                                'unit_name'     => $this->input->post('asset_name')[$i],
                                'qty'           => $this->input->post('qty')[$i],
                                'unit_type'     => $this->input->post('specific')[$i],
                                'unit'          => $this->input->post('unit')[$i],
                                'date_received' => $this->input->post('date')[$i]
                            );

                            $insert_assets_result = $this->user_model->insert('assets', $data_for_assets_tbl);
                        }
 
                        if($insert_assets_result['result'] == TRUE){

                            $user_data = array(
                                'insert'  => true,
                                'message' => 'Room name and its assets were saved successfully.'
                            );
                            echo json_encode($user_data);
                        }
                        else{

                            $user_data = array(
                                'insert'  => false,
                                'message' => 'Cannot insert assets data.'
                            );
                            echo json_encode($user_data);
                        }
                    }
                    else{

                        $user_data = array(
                            'insert'  => false,
                            'message' => 'Room name were not inserted together with its assets.'
                        );
                        echo json_encode($user_data);
                    }
                }
            }
            else{

                $user_data = array(
                    'insert'  => false,
                    'message' => 'There is no '.$this->input->post('bldg_name').' on the lists.'
                );
                echo json_encode($user_data);
            }
        }
        else{

            redirect('page/view/home');
        }
    }

    public function get_room_assets(){

        if(isset($_POST['room_val']) && !empty($_POST['room_val'])){

            $return_result = $this->user_model->get_room_assets($this->input->post('room_val'));
            if($return_result['result'] == TRUE){

                echo json_encode($return_result['value']);
            }
            
        }
        else{

            redirect('page/view/home');
        }
    }
    
    public function update_assets()
    {
        if(isset($_POST['action']) && $_POST['action'] == 'update_assets'){

            $data_assets = array(
                'serial_no' => $this->input->post('serial'),
                'unit_name' => $this->input->post('unit_name'),
                'qty'       => $this->input->post('qty'),
                'unit'      => $this->input->post('unit'),
                'unit_type' => $this->input->post('unit_type')
            );
            $return_result = $this->user_model->update_assets('assets', $this->input->post('id'), $data_assets);
            if($return_result['result'] == TRUE){

                $user_data = array(
                    'update'  => true,
                    'message' => $return_result['message']
                );
                echo json_encode($user_data);
            }
            else
            {
                $user_data = array(
                    'update'  => false,
                    'message' => $return_result['message']
                );
                echo json_encode($user_data);
            }
        }
        else{

            redirect('page/view/home');
        }
    }

    public function delete_assets(){

        if(isset($_POST['id']) && !empty($_POST['id'])){

            $return_result = $this->user_model->delete_assets('assets', $this->input->post('id'));
            if($return_result['result'] == TRUE){

                $user_data = array(
                    'delete'  => true,
                    'message' => $return_result['message']
                );
                echo json_encode($user_data);
            }
            else
            {
                $user_data = array(
                    'delete'  => false,
                    'message' => $return_result['message']
                );
                echo json_encode($user_data);
            }
        }
        else{

            redirect('page/view/home');
        }
    }

    public function add_assets(){
        
        if(isset($_POST['room_id']) && !empty($_POST['room_id'])){
            
            for($i = 0; $i < count($this->input->post('serial')); $i++) {

                $return_result = $this->user_model->delete_assets('assets', $this->input->post('serial')[$i]);
            }

            if($return_result['result'] == TRUE || $return_result['result'] == FALSE){

                for ($i = 0; $i < count($this->input->post('asset_name')); $i++) {

                    $data_for_assets_tbl = array(
                        'room_id'       => $this->input->post('room_id'),
                        'serial_no'     => $this->input->post('serial')[$i],
                        'unit_name'     => $this->input->post('asset_name')[$i],
                        'qty'           => $this->input->post('qty')[$i],
                        'unit_type'     => $this->input->post('specific')[$i],
                        'unit'          => $this->input->post('unit')[$i],
                        'date_received' => $this->input->post('date')[$i]
                    );

                    $insert_assets_result = $this->user_model->insert('assets', $data_for_assets_tbl);
                }

                if($insert_assets_result['result'] == TRUE){

                    $user_data = array(
                        'insert'  => true,
                        'message' => 'Assets were added and saved successfully.'
                    );
                    echo json_encode($user_data);
                }
                else{

                    $user_data = array(
                        'insert'  => false,
                        'message' => 'Cannot insert assets data.'
                    );
                    echo json_encode($user_data);
                }
            }
        }
    }

    public function reset()
    {
        if(isset($_POST['email']) && !empty($_POST['email'])){

            $return_result = $this->user_model->look_up_email('user_table', $this->input->post('email'));
            if($return_result['result'] == TRUE){
                
                $reset_result = $this->user_model->reset('user_table', $return_result['id'], $this->input->post('pass'));
                if($reset_result['result'] == TRUE){

                    $user_data = array(
                        'update'  => true,
                        'message' => $reset_result['message']
                    );
                    echo json_encode($user_data);
                }
                else{
                    $user_data = array(
                        'update'  => false,
                        'message' => $reset_result['message']
                    );
                    echo json_encode($user_data);
                }
            }
            else{
                $user_data = array(
                    'update'  => false,
                    'message' => 'There is no such such user exists with Email/username : '. $this->input->post('email')
                );
                echo json_encode($user_data);
            }
        }
    }

}