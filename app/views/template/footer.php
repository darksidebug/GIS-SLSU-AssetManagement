    <!-- Bootstrap core JavaScript and JQuery-->
    <!-- <script src="<?= base_url(); ?>assets/js/jquery.min.js"></script>
    <script src="<?= base_url(); ?>resources/js/jquery-3.3.1.min.js"></script>
    <script src="<?= base_url(); ?>assets/bootstrap/js/bootstrap.min.js"></script> -->
    <!-- <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script> -->
    <!-- <script src="<?= base_url(); ?>assets/datatables/js/dataTables.material.js"></script>
    <script src="<?= base_url(); ?>assets/datatables/js/jquery.dataTables.js"></script>   -->

    <!--- script -->
    
    <script>
        $(document).ready(function(){
            var collapse = false;
            $(document).on('click', '.toggler-in', function(){
                $(".col-md-4").addClass('toggle-in');
                $(".col-md-4").removeClass('toggle-out');
            });

            $(document).on('click', '.toggler-out', function(){
                $(".col-md-4").addClass('toggle-out');
                $(".col-md-4").removeClass('toggle-in');      
            });

            $(document).on("click", ".btn-link-collapsed", function(){
                
                if(collapse === false){
                    document.querySelector("ul.search-tooltip").style.maxHeight = '253px';
                    collapse = true;
                }
                else if(collapse === true){
                    document.querySelector("ul.search-tooltip").style.maxHeight = '580px';
                    collapse = false;
                }
                
            });

            $(document).on("click", "#btn-link", function(){
                document.querySelector("ul.search-tooltip").style.maxHeight = '365px';
                collapse = false;
            });

            // var search = document.querySelector("a.search-button");
            // search.addEventListener('click', function(){
            //     $.post('<?= base_url(); ?>user/get_assets/'+ search_val, function(data){
            //         console.log(data);
            //         // load_data(data);
            //     })
            // });
            
        });
    </script>

</body>
</html>