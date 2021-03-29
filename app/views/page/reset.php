<div class="container sign_up">
        <div class="row">
            <div class="col-md-3"></div>
            <div class="col-md-6">
                <h5 class="note">Reset your password here!</h5>
                <span id="error"></span>
                <form method="post" action="#" id="sign_up_form">
                    <div class="form-group">
                        <label for="my-email">Email/Username: <span id="user_err">*(Email or Username is required.)</span></label>
                        <input id="my-email" class="form-control" type="text" name="email" placeholder="Email or Username">
                    </div>
                    <div class="form-group">
                        <label for="my-user_pass">New Password: <span id="pass_err">*(Atleast 8 character long, must contain the following [a-z/A-Z/0-9].)</span></label>
                        <input id="my-user_pass" class="form-control" type="password" name="password" placeholder="Password" required>
                    </div>
                    <div class="form-group">
                        <label for="my-pass_cfm">Confirm New Password: <span id="cfm_pass_err">*(Confirmation password did not match the password provided.)</span></label>
                        <input id="my-pass_cfm" class="form-control" type="password" name="password_confirm" placeholder="Confirm Password" required>
                    </div>
                    <center>
                        <button type="submit" name="sign-up" id="sign-up" class="btn btn-primary">Reset Password</button>
                        </br></br>
                        <h7 style="font-size: 13px;">
                            Already have an account? <a href="<?= base_url(); ?>page/form/sign-in">Sign-in Now</a>
                        </h7>
                    </center>
                    <p>devApp&copy; SOUTHERN LEYTE STATE UNIVERSITY @ Sogod Main-Campus</p>
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

        var myInput     = document.getElementById("my-user_pass");
        var myCfm_Input = document.getElementById("my-pass_cfm");
        var my_email    = document.getElementById("my-email");

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

        myCfm_Input.onfocus = function(){
            document.getElementById("cfm_pass_err").style.display = "inline-block";
            document.getElementById("cfm_pass_err").style.color   = "red";
        }

        myInput.onkeyup = function(){
            check();
        }

        myCfm_Input.onkeyup = function(){
            if(myCfm_Input.value.match(myInput.value))
            {
                document.getElementById("cfm_pass_err").innerText   = "*(Corfirmation password and password provided matched.)";
                document.getElementById("cfm_pass_err").style.color = "green";
                setTimeout(function(){
                    document.getElementById("cfm_pass_err").style.display = "none";
                }, 1000);
            }
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
                document.getElementById("pass_err").style.display     = "none";
                document.getElementById("cfm_pass_err").style.display = "none";
                document.getElementById("user_err").style.display     = "none";
            }, 5000);
        }

        $(document).on('click', '#sign-up', function(e){

            e.preventDefault();
            var pass = $('#my-user_pass').val();
            var pass_cfm = $('#my-pass_cfm').val();
            var email = $("#my-email").val();

            if(email != "" && pass != "" && pass_cfm != "")
            {
                var route = $('#sign_up_form').data('route');
                check();
                if(pass == pass_cfm)
                {
                    timeOutfunction();
                    $.ajax({
                        url: '<?= base_url(); ?>user/reset',
                        type: 'POST',
                        data: {
                            email : email,
                            pass  : pass
                        },
                        success:function(data){

                            var data_Object = JSON.parse(data);
                            console.log(data_Object);

                            if(data_Object.update == true)
                            {
                                $("#error").html('<div class="alert alert-success alert-dismissible fade show" role="alert">'
                                + data_Object.message +
                                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                                '<span aria-hidden="true">&times;</span></button></div>');
                                $("#sign_up_form")[0].reset();
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
                    document.getElementById("pass_err").style.display     = "inline-block";
                    document.getElementById("pass_err").innerText         = "*(Password provided did not matched the confirmation password.)";
                    document.getElementById("pass_err").style.color       = "red";
                    document.getElementById("cfm_pass_err").style.display = "inline-block";
                    document.getElementById("cfm_pass_err").innerText     = "*(Corfirmation password and password provided matched.)";
                    document.getElementById("cfm_pass_err").style.color   = "red";
                    timeOutfunction();
                }
            }
            else{
                document.getElementById("user_err").style.display     = "inline-block";
                document.getElementById("user_err").style.color       = "red";
                document.getElementById("pass_err").style.display     = "inline-block";
                document.getElementById("pass_err").style.color       = "red";
                document.getElementById("cfm_pass_err").style.display = "inline-block";
                document.getElementById("cfm_pass_err").style.color   = "red";
                timeOutfunction();
            }
        })
    </script>