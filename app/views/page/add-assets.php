
    <form  method="post" id="form_data">
        <div class="container adding-assets">
            <h3>Add Rooms/Offices Assets</h3>
            <span id="error"></span>
            <div class="row">
                <div class="col-md-12">
                    <table class="table" id="input">
                        <tr>
                            <div class="row" style="margin-bottom: 15px;">
                                <div class="col-md-4">
                                    <label for="">Building Name</label>
                                    <select type="text" name="bldg_name" id="bldg_name" class="form-control bldg_name" required>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="">Officer In-Charge</label>
                                    <input type="text" name="in_charge" id="in_charge" class="form-control in_charge" placeholder="Officer In-Charge" required>
                                </div>
                                <div class="col-md-4">
                                    <label for="">Rooms/Offices</label>
                                    <input type="text" name="rooms_offices" id="rooms_offices" class="form-control rooms_offices" placeholder="Enter Rooms/Offices" required>
                                </div>
                            </div>
                        </tr>
                        <tr><td></td><td></td><td></td></tr>
                    </table>
                </div>
            </div>
            <div class="row" style="margin-top: -25px;">
                <div class="col-md-12">
                    <table class="table table-hover">
                        <thead>
                            <tr style="background-color: #007BFF; color: #fff;">
                                <td></td>
                                <td>SERIAL NO.</td>
                                <td>ASSETS NAME</td>
                                <td>QUANTITY</td>
                                <td>UNIT TYPE</td>
                                <td>ASSETS SPECIFICATION</td>
                                <td>DATE RECEIVE</td>
                            </tr>
                        </thead>
                        <tbody class="adding_of_assets">

                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="12">
                                    <div align="right">
                                        <button class="btn btn-primary btn-sm btn_add_row"><i class="fa fa-plus"></i></button>
                                        <button class="btn btn-danger btn-sm btn_del_row"><i class="fa fa-minus"></i></button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="12">
                                    <div align="right">
                                        <button type="submit" class="btn btn-primary btn-md btn_save"><i class="fa fa-pencil"></i>&nbsp;SAVE ASSETS</button>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    </form>
    <script>

        onload();
        function onload(){
            var options = "", get = 'bldg';
            $.ajax({
                url : '<?= base_url(); ?>user/get_bldg',
                type: 'POST',
                data: {
                    get : get
                },
                success:function(data){
                    var data_Object = JSON.parse(data);
                    console.log(data_Object);
                    options += '<option>Select Buildings</option>';
                    $.each(data_Object, function(i, value){
                        options += '<option value="'+ value.bldg_name +'">'+ value.bldg_name +'</option>';
                    });
                    $('#bldg_name').html(options);
                }
            });
        }

        $(document).on('change', '#bldg_name', function(){
            var options = "", get = 'rooms';
            var value = $(this).val();
            $.ajax({
                url : '<?= base_url(); ?>user/get_rooms',
                type: 'POST',
                data: {
                    get   : get,
                    value : value
                },
                success:function(data){
                    var data_Object = JSON.parse(data);
                    console.log(data_Object);
                    options += '<option>Select Rooms</option>';
                    $.each(data_Object, function(i, value){
                        $('#in_charge').val(value.college_head);
                        $.each(value.rooms, function(i, bldg_rooms) {
                            options += '<option value="'+ bldg_rooms.rooms +'">'+ bldg_rooms.rooms +'</option>';
                        });
                    });
                    $('#rooms_offices').html(options);
                }
            });
        })
        
        var html_row = "", row_count = 1;
        $(document).on("click", ".btn_add_row", function(e){
            e.preventDefault();
            html_row = "";
            html_row += '<tr id="row'+ row_count +'">';
            html_row += '<td><input type="checkbox" name="checkbox" class="checkbox" id="'+ row_count +'"></td>';
            html_row += '<td><input type="text" name="serial[]" id="serial" class="form-control serial" required></td>';
            html_row += '<td><input type="text" name="asset_name[]" id="asset_name" class="form-control asset_name" required></td>';
            html_row += '<td><input type="text" name="asset_qty[]" id="asset_qty" class="form-control asset_qty" required></td>';
            html_row += '<td><input type="text" name="asset_unit_type[]" id="asset_unit_type" class="form-control asset_unit_type" required></td>';
            html_row += '<td><input type="text" name="asset_specification[]" id="asset_specification" class="form-control asset_specification" required></td>';
            html_row += '<td><input type="date" name="date[]" id="date" class="form-control date" required></td>';
            html_row += '</tr>';
            row_count++;
            $("tbody.adding_of_assets").append(html_row);
        });

        $(document).on("click", ".btn_del_row", function(e){
            e.preventDefault();
            $("tbody.adding_of_assets").find('input[name="checkbox"]').each(function(){
                if($(this).is(":checked")){
                    $(this).parents("tr").remove();
                }
            });
        });

        $(document).on("click", ".btn_save", function(e){
            e.preventDefault();
            var route = $('#form_data').data('route');
            var error = '';
            
            var serial = [], asset_name = [], qty = [], unit = [], specific = [], date = [];
            $('.serial').each(function(){
                if($(this).val() == '')
                {
                    error += "<p>Enter serial number at column 1 empty field(s).</p>"
                    return false;
                }
                serial.push($(this).val());
            });
            $('.asset_name').each(function(){
                if($(this).val() == '')
                {
                    error += "<p>Enter assets name at column 2 empty field(s).</p>";
                    return false;
                }
                asset_name.push($(this).val());
            });
            $('.asset_qty').each(function(){
                if($(this).val() == '')
                {
                    error += "<p>Enter asset quantity at column 3 empty field(s).</p>"
                    return false;
                }
                qty.push($(this).val());
            });
            $('.asset_unit_type').each(function(){
                if($(this).val() == '')
                {
                    error += "<p>Enter asset unit type at column 4 empty field(s).</p>"
                    return false;
                }
                unit.push($(this).val());
            });
            $('.asset_specification').each(function(){
                if($(this).val() == '')
                {
                    error += "<p>Enter asset specification at column 5 empty field(s).</p>"
                    return false;
                }
                specific.push($(this).val());
            });
            $('.date').each(function(){
                if($(this).val() == '')
                {
                    error += "<p>Enter date receive at column 6 empty field(s).</p>"
                    return false;
                }
                date.push($(this).val());
            });

            var bldg_name = $('.bldg_name').val();
            var in_charge = $('.in_charge').val();
            var rooms_offices = $('.rooms_offices').val();

            if(bldg_name == '')
            {
                error += "<p>Enter building name.</p>"
            }

            if(in_charge == '')
            {
                error += "<p>Enter officer in-charge.</p>"
            }

            if(rooms_offices == '')
            {
                error += "<p>Enter room name or office name.</p>"
            }

            var form_data = $("#form_data").serialize();
            var action = 'insert_assets';
            if(error == ''){
                $.ajax({
                    url: '<?= base_url(); ?>user/store_data_assets',
                    type: 'POST',
                    data: { 
                        serial        : serial,
                        asset_name    : asset_name,
                        qty           : qty,
                        unit          : unit,
                        specific      : specific,
                        date          : date,
                        action        : action, 
                        rooms_offices : rooms_offices, 
                        bldg_name     : bldg_name
                    },
                    success:function(data){
                        var data_Object = JSON.parse(data);
                        console.log(data);
                        if(data_Object.insert == true){
                            $("#error").html('<div class="alert alert-success alert-dismissible fade show" role="alert">'
                                + data_Object.message +
                                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                                '<span aria-hidden="true">&times;</span></button></div>');

                            $("#form_data")[0].reset();
                            $("tbody.adding_of_assets").find("tr").remove();
                        }
                        else{
                            $("#error").html('<div class="alert alert-danger alert-dismissible fade show" role="alert">'
                                + data_Object.message +
                                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                                '<span aria-hidden="true">&times;</span></button></div>');
                        }
                    }
                });
            }
            else{
                $("#error").html('<div class="alert alert-danger alert-dismissible fade show" role="alert">'
                    + error +
                    '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                    '<span aria-hidden="true">&times;</span></button></div>');
            }
        });
    </script>