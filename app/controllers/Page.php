<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Page extends CI_Controller {

	public function __construct(){

        parent::__construct();
        $this->load->library('session');
        $this->load->model('UserModel');
    }

    public function index(){
        
        redirect('page/view/home/');
    }

    public function view($page = null){
        if (!file_exists(APPPATH.'views/page/'.$page.'.php')) {
			show_404();
        }

        if($page === 'add-assets' || $page === 'asset-lists' || 
            $page === 'student-guest-view' || $page === 'admin-view' || $page === 'add-admin'){
            
            redirect('/');
        }
        else{
            $this->load->view('template/head');
            $this->load->view('template/navigation');
            $this->load->view('page/'.$page);
            $this->load->view('template/footer');
        }
    }

    public function form($page = null){

        if (!file_exists(APPPATH.'views/page/'.$page.'.php')) {
			show_404();
        }
        
        if($this->session->userdata('logged_in') == FALSE){

            if($page == 'add-assets' || $page == 'asset-lists' || $page == 'student-guest-view' || 
               $page == 'admin-view' || $page == 'home' || $page == 'add-admin' || $page == 'about'){
                
                redirect('page/form/sign-in');
            }
            else{
                
                $this->load->view('template/head');
                $this->load->view('template/navigation');
                $this->load->view('page/'.$page);
                $this->load->view('template/footer');
            }
        }
        else{

            if($this->session->userdata('logged_in') == TRUE && 
               $this->session->userdata('user_type') == 'Super_Admin' && $page == 'add-admin'){

                $this->load->view('template/head');
                $this->load->view('template/navigation');
                $this->load->view('page/'.$page);
                $this->load->view('template/footer');
            }
            else{
                redirect('/');
            }
        }
    }

    public function display($page = null){

        if (!file_exists(APPPATH.'views/page/'.$page.'.php')) {
			show_404();
        }

        if($this->session->userdata('logged_in') == TRUE){

            if($page == 'asset-lists' || $page == 'add-assets')
            {
                if($this->session->userdata('user_type') == 'Admin' || $this->session->userdata('user_type') == 'Super_Admin'){
                    
                    $this->load->view('template/head');
                    $this->load->view('template/navigation');
                    $this->load->view('page/'.$page);
                    $this->load->view('template/footer');
                }
                else{
                    redirect('/');
                }
            }
            else{
                redirect('/');
            }
        }
        else{
            redirect('page/form/sign-in');
        } 
    }

    public function map($page = null){

        if (!file_exists(APPPATH.'views/page/'.$page.'.php')) {
			show_404();
        }

        if($this->session->userdata('logged_in') == FALSE){
            
            redirect('page/form/sign-in');
        }
        else{

            if($this->session->userdata('user_type') == 'Guest' && $page == 'student-guest-view'){

                $this->load->view('template/head');
                $this->load->view('template/scripts');
                $this->load->view('template/navigation');
                $this->load->view('page/'.$page);
                $this->load->view('template/footer');   
            }  
            elseif(($this->session->userdata('user_type') == 'Admin' || 
                $this->session->userdata('user_type') == 'Super_Admin') && $page == 'admin-view'){

                $this->load->view('template/head');
                $this->load->view('template/scripts');
                $this->load->view('template/navigation');
                $this->load->view('page/'.$page);
                $this->load->view('template/footer');   
            }
            else{
                redirect('/');
            } 
        } 
    }

    public function user($action){

        if($action == 'sign-out')
        {
            if($this->session->userdata('logged_in') == TRUE){
                $this->session->sess_destroy();
                redirect('page/form/sign-in');
            }
            else{
                redirect('page/form/sign-in');
            }
        }
        else{
            redirect('page/form/sign-in');
        }
    }

}