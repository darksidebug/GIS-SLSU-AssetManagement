    <div class="container sign_in">
        <div class="row">
            <div class="col-md-3"></div>
            <div class="col-md-6">
                <h5 class="note">Please fill in your credentials.</h5>
                <span id="error"></span>
                <form method="POST" id="sign_in_form" action="#">
                    <div class="form-group">
                        <label for="my-user">Email or Username: <span id="user_err">*(Email or Username is required.)</span></label>
                        <input id="my-user" class="form-control" type="text" name="email" placeholder="Email or Username" required>
                    </div>
                    <div class="form-group">
                        <label for="my-pass">Password: <span id="pass_err">*(Atleast 8 character long, must contain the following [a-z/A-Z/0-9].)</span></label>
                        <input id="my-pass" class="form-control" type="password" name="pass" placeholder="Password" required>

                    </div>
                    <center>
                        <button class="btn btn-primary" id="login"><i class="fa fa-user-circle"></i> Sign In</button></br>
                        <a class="btn btn-link" href="<?= base_url(); ?>page/form/reset">
                            Forgot Your Password?
                        </a></br></br>
                        <h7 style="font-size: 13px;">
                            Don't have an account yet? <a href="<?= base_url(); ?>page/form/sign-up">Sign-up Now</a>
                        </h7>
                    </center>
                    <p class="text-center">devApp&copy; SOUTHERN LEYTE STATE UNIVERSITY @  Sogod Main-Campus</p>
                </form>
            </div>
            <div class="col-md-3"></div>
        </div>
    </div>
    <style>
        h3{
            font-size: 13px;
            color: red;
        }
        #pass_err, #cfm_pass_err, #user_err{
            font-size: 14px;
            display:none;
        }
    </style>
    <script>

        var myInput  = document.getElementById("my-pass");
        var my_email = document.getElementById("my-user");

        my_email.onblur = function(){
            if(my_email.value == "")
            {
                document.getElementById("user_err").style.display = "inline-block";
                document.getElementById("user_err").style.color   = "red";
                setTimeout(function(){
                    document.getElementById("user_err").style.display = "none";
                }, 3000)
            }
        }

        myInput.onfocus = function(){
            display_message();
        }

        myInput.onkeyup = function(){
            check();
        }

        myInput.onblur = function(){
            setTimeout(function(){
                document.getElementById("pass_err").style.display = "none";
            }, 1000);
        }

        function check(){
            var lowerCaseLetters = /[a-z]/g;
            if(myInput.value.match(lowerCaseLetters)) {
                var upperCaseLetters = /[A-Z]/g;
                if(myInput.value.match(upperCaseLetters)) {
                    var numbers = /[0-9]/g;
                    if(myInput.value.match(numbers)) {
                        if(myInput.value.length >= 8) {
                            document.getElementById("pass_err").style.color = "green";
                        } else {
                            display_message();
                        }
                    } else {
                        display_message();
                    }
                } else {
                    display_message();
                }
            } else {
                display_message();
            }
        }

        function display_message()
        {
            document.getElementById("pass_err").style.display = "inline-block";
            document.getElementById("pass_err").style.color   = "red";
        }

        function timeOutfunction() {
            setTimeout(function(){
                document.getElementById("pass_err").style.display = "none";
                document.getElementById("user_err").style.display = "none";
            }, 5000);
        }
        $(document).on('click', '#login', function(e){

            e.preventDefault();
            var pass   = $('#my-pass').val();
            var user   = $('#my-user').val();
            var action = 'sign-in';
            check();

            if(pass != "" && user != "")
            {
                timeOutfunction();
                $.ajax({
                    url : '<?= base_url(); ?>user/sign_in',
                    type: 'POST',
                    data: {
                        pass   : pass,
                        user   : user,
                        action : action
                    },
                    success:function(data){
                        var data_Object = JSON.parse(data);
                        console.log(data_Object);
                        if(data_Object.login == true)
                        {
                            if(data_Object.user_type == "Admin" || data_Object.user_type == "Super_Admin")
                            {
                                window.location.href = '<?= base_url(); ?>page/map/admin-view';
                            }
                            if(data_Object.user_type == "Guest")
                            {
                                window.location.href = '<?= base_url(); ?>page/map/student-guest-view';
                            }
                        }
                        else{
                            $("#error").html('<div class="alert alert-danger alert-dismissible fade show" role="alert">'
                            + data_Object.message +
                            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                            '<span aria-hidden="true">&times;</span></button></div>');
                        }
                    }
                })
            }
            else{
                document.getElementById("user_err").style.display = "inline-block";
                document.getElementById("user_err").style.color   = "red";
                document.getElementById("pass_err").style.display = "inline-block";
                document.getElementById("pass_err").style.color   = "red";
                timeOutfunction();
            }
        })
    
    </script>