<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class UserModel extends CI_Model {

    public function __construct(){

        parent::__construct();
        $this->load->database();
    }

    public function sign_in($table, $email, $pass)
    {
                  $this->db->where('email', $email);
        $result = $this->db->get($table);
        if($result->num_rows() > 0){

            foreach ($result->result() as $row => $value) {
                
                if($this->hash_verify($pass, $value->email_pass))
                {
                    return ['result' => TRUE, 'user_type' => $value->user_type, 'user_email' => $value->email];
                }
            }
        }
        else{
            return ['result' => FALSE, 'user_type' => '', 'user_email' => ''];
            return FALSE;
        }
    }

    public function sign_up($table, $email, $pass, $type)
    {
        $data = array(
            'email'      => $email,
            'email_pass' => $this->hash_password($pass),
            'user_type'  => $type
        );
                            $this->db->insert($table, $data);
        $last_inserted_id = $this->db->insert_id();
        if($last_inserted_id){

            return ['result' => TRUE, 'user_type' => $data['user_type'], 'user_email' => $data['email']];
        }
        else{
            return ['result' => FALSE, 'user_type' => '', 'user_email' => ''];
            return FALSE;
        }
    }

    public function get_assets($building)
    { 
                  $this->db->like('bldg_name', $building);
        $result = $this->db->get('slsu_bldg')->result();

        foreach($result as $row => $value)
        {
                                     $this->db->where('bldg_id', $value->id);
                                     $this->db->order_by('rooms');
            $rooms = $value->rooms = $this->db->get('rooms')->result();
        }

        foreach($rooms as $row => $value)
        {
            $value->assets  =  $this->db->query('SELECT SUM(qty) as qty, unit_name, unit_type, unit FROM assets 
                                                    WHERE room_id = '.$value->id.' GROUP BY unit_name, unit, unit_type')->result();
        }

        if(!empty($result))
        {
            return ['result' => TRUE, 'value' => $result];
        }
        else
        {
            return ['result' => FALSE, 'value' => ''];
            return FALSE;
        }
    }

    public function get_bldg()
    {
        $buildings = $this->db->get('slsu_bldg')->result();

        if(!empty($buildings))
        {
            return ['result' => TRUE, 'value' => $buildings];
        }
        else
        {
            return ['result' => FALSE, 'value' => ''];
            return FALSE;
        }
    }

    public function get_building($building)
    {
                     $this->db->like('bldg_name', $building);
        $buildings = $this->db->get('slsu_bldg')->result();

        if(!empty($buildings))
        {
            return ['result' => TRUE, 'value' => $buildings];
        }
        else
        {
            return ['result' => FALSE, 'value' => ''];
            return FALSE;
        }
    }

    public function get_rooms($building)
    {
                  $this->db->like('bldg_name', $building);
        $result = $this->db->get('slsu_bldg')->result();
        foreach($result as $key => $value)
        {
                            $this->db->where('bldg_id', $value->id);
                            $this->db->order_by('rooms');
            $value->rooms = $this->db->get('rooms')->result();
        }

        if(!empty($result))
        {
            return ['result' => TRUE, 'value' => $result];
        }
        else
        {
            return ['result' => FALSE, 'value' => ''];
            return FALSE;
        }
    }

    public function get_room($room)
    {
                  $this->db->like('rooms', $room);
        $result = $this->db->get('rooms')->result();

        if(!empty($result))
        {
            return ['result' => TRUE, 'value' => $result];
        }
        else
        {
            return ['result' => FALSE, 'value' => ''];
            return FALSE;
        }
    }

    public function insert($table, $data)
    {
                  $this->db->insert($table, $data);
        $result = $this->db->insert_id();
        
        if(!empty($result))
        {
            return ['result' => TRUE, 'value' => $result];
        }
        else
        {
            return ['result' => FALSE, 'value' => ''];
            return FALSE;
        }
    }

    public function get_room_assets($room)
    {
                  $this->db->like('rooms', $room);
        $result = $this->db->get('rooms')->result();

        foreach($result as $key => $value)
        {
                             $this->db->where('room_id', $value->id);
            $value->assets = $this->db->get('assets')->result();
        }

        if(!empty($result))
        {
            return ['result' => TRUE, 'value' => $result];
        }
        else
        {
            return ['result' => FALSE, 'value' => ''];
            return FALSE;
        }
    }

    public function update_assets($table, $value, $data)
    {
                  $this->db->where('id', $value);
                  $this->db->set($data);
        $result = $this->db->update($table); 

        if($result)
        {
            return ['result' => TRUE, 'message' => 'Asset(s) record updated successfully.'];
        }
        else
        {
            return ['result' => FALSE, 'message' => 'Assets record update failed.'];
            return FALSE;
        }
    }

    public function delete_assets($table, $value)
    {
                  $this->db->where('id', $value);
        $result = $this->db->delete($table); 

        if($result)
        {
            return ['result' => TRUE, 'message' => 'Asset(s) record deleted successfully.'];
        }
        else
        {
            return ['result' => FALSE, 'message' => 'Assets record deletion failed.'];
            return FALSE;
        }
    }

    public function remove_assets($table, $value)
    {
                  $this->db->where('serial_no', $value);
        $result = $this->db->delete($table); 

        if($result)
        {
            return ['result' => TRUE, 'message' => 'Asset(s) record deleted successfully.'];
        }
        else
        {
            return ['result' => FALSE, 'message' => 'Assets record deletion failed.'];
            return FALSE;
        }
    }

    public function look_up_email($table, $email)
    {
                  $this->db->where('email', $email);
        $result = $this->db->get($table)->result();
        if(!empty($result))
        {
            foreach ($result as $key => $value) {

                return ['result' => TRUE, 'id' => $value->id, 'user_type' => $value->user_type];
            }
        }
        else
        {
            return ['result' => FALSE, 'id' => '', 'user_type' => ''];
        }
    }

    public function reset($table, $value, $pass)
    {
                  $this->db->where('id', $value);
                  $this->db->set('email_pass', $this->hash_password($pass));
        $result = $this->db->update($table); 

        if($result)
        {
            return ['result' => TRUE, 'message' => 'Your password has been updated. You can now sign in.'];
        }
        else
        {
            return ['result' => FALSE, 'message' => 'Error on password reset.'];
            return FALSE;
        }
    }

    private function hash_password($password){
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
    }

    private function hash_verify($password, $hashed_password){
        return password_verify($password, $hashed_password);
    }
}