<nav class="navbar navbar-expand-lg navbar-light bg-light">
    <a class="navbar-brand image" href="#">
        <img class="img img-responsive" src="<?= base_url(); ?>assets/img/LOGO.png" alt="">
        <!-- SLSU-MC GIS MAP -->
    </a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target=".collapse" aria-controls="collapse" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarColor01">
        <ul class="navbar-nav mr-auto">
            <li class="nav-item active">
                <a class="nav-link" href="<?= base_url(); ?>/">Home <span class="sr-only">(current)</span></a>
            </li>

            <?php if($this->session->userdata('logged_in') == FALSE): ?>
                <li class="nav-item">
                    <a class="nav-link" href="<?= base_url(); ?>page/form/sign-in">Campus Map</a>
                </li>
            <?php endif; ?>

            <?php if($this->session->userdata('logged_in') == TRUE): ?>
                <?php if($this->session->userdata('user_type') == 'Guest'): ?>
                    <li class="nav-item">
                        <a class="nav-link" href="<?= base_url(); ?>page/map/student-guest-view">Campus Map</a>
                    </li>
                <?php elseif($this->session->userdata('user_type') == 'Admin' || $this->session->userdata('user_type') == 'Super_Admin'): ?>
                    <li class="nav-item">
                        <a class="nav-link" href="<?= base_url(); ?>page/map/admin-view">Campus Map</a>
                    </li>
                <?php endif; ?>
            <?php endif; ?>
            
            <?php if($this->session->userdata('logged_in') == TRUE && 
                $this->session->userdata('user_type') == 'Super_Admin'): ?>
                <li class="nav-item">
                    <a class="nav-link" href="<?= base_url(); ?>page/form/add-admin">Add User</a>
                </li>
            <?php endif; ?>

            <li class="nav-item">
                <a class="nav-link" href="<?= base_url(); ?>page/view/about">About</a>
            </li>

            <?php if($this->session->userdata('logged_in') == FALSE): ?>
                <li class="nav-item signin">
                    <a id="sign_in" class="nav-link" href="<?= base_url(); ?>page/form/sign-in">Sign-In</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="<?= base_url(); ?>page/form/sign-up">Sign-Up</a>
                </li>
            <?php endif; ?>

            <?php if($this->session->userdata('logged_in') == TRUE): ?>
                <li class="nav-item">
                    <a class="nav-link" href="<?= base_url(); ?>page/user/sign-out">Sign-Out</a>
                </li>
            <?php endif; ?>

        </ul>

        <?php if($this->session->userdata('logged_in') == TRUE && 
                $this->session->userdata('user_type') == 'Admin' || $this->session->userdata('user_type') == 'Super_Admin'): ?>
            <ul class="navbar-nav ml-auto">
                <li class="nav-item">
                    <a href="<?= base_url(); ?>page/display/asset-lists" class="nav-link">VIEW ASSETS</a>
                </li>
                <li class="nav-item">
                    <a href="<?= base_url(); ?>page/display/add-assets" class="nav-link">ADD ASSETS</a>
                </li>
            </ul>
        
        <?php endif; ?>
    </div>
</nav>
