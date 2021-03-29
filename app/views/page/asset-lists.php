    <div class="container view-assets">
        <h3 style="text-transform:uppercase; margin-bottom: 30px;">Building's Rooms and Assets</h3>
        <span id="message"></span>
        <div class="row">
            <div class="col-md-12">
                <input type="hidden" name="" id="room_id">
                <table class="table" id="input">
                    <tr>
                        <div class="row" style="margin-bottom: 15px;">
                            <div class="col-md-3">
                                <label for="building">Building Name</label>
                                <select type="text" class="form-control" id="building">
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="">Officer In-Charge</label>
                                <input type="text" class="form-control" id="in_charge" placeholder="Officer In-Charge">
                            </div>
                            <div class="col-md-3">
                                <label for="">Rooms/Offices</label>
                                <select type="text" class="form-control" id="rooms">
                                    <option>Select Rooms/Offices</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <!-- <label for="">Add Assets</label> -->
                                <button type="button" class="btn btn-primary btn-block" id="add" style="border-radius: 2px; margin-top: 32px; height: 35px;
                                  padding: 5px 15px;">ADD / TRANSFER ASSETS</button>
                            </div>
                        </div>
                    </tr>
                    <tr><td></td><td></td><td></td></tr>
                </table>
            </div>
        </div>
        <div class="row" style="margin-top: -25px;">
            <div class="col-md-12">
                <table class="table table-hover" id="assets">
                    <thead>
                        <tr style="background-color: #007BFF; color: #fff;">
                            <td></td>
                            <td>SERIAL NO</td>
                            <td>ASSETS NAME</td>
                            <td>QUANTITY</td>
                            <td>UNIT TYPE</td>
                            <td>ASSETS SPECIFICATION</td>
                            <td id="date_added" style="display: none;">DATE ADDED</td>
                            <td id="action"></td>
                        </tr>
                    </thead>
                    <tbody id="assets-lists">

                    </tbody>
                    <tfoot id="footer" style="visibility: hidden;">
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
                                    <button type="submit" class="btn btn-warning btn-md btn_hide"><i class="fa fa-times"></i></button>
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
    <script>
        $(document).ready(function(){

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

                        $('#building').html(options);
                    }
                });
            }

            $(document).on('change', '#building', function(){

                var options = "", get = 'rooms';
                var value   = $(this).val();
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
                        options += '<option>Select Rooms/Offices</option>';

                        $.each(data_Object, function(i, value){
                            $('#in_charge').val(value.college_head);
                            $.each(value.rooms, function(i, bldg_rooms) {
                                options += '<option value="'+ bldg_rooms.rooms +'">'+ bldg_rooms.rooms +'</option>';
                            });
                        });

                        $('#rooms').html(options);
                    }
                });
            })

            function room_asset()
            {
                var html     = "";
                var room_val = $("#rooms").val();

                $.ajax({
                    url : '<?= base_url(); ?>user/get_room_assets',
                    type: 'POST',
                    data: {
                        room_val : room_val
                    },
                    success:function(data){

                        var data_Object = JSON.parse(data);
                        console.log(data_Object);

                        $.each(data_Object, function(i, value){

                            $('#room_id').val(value.id);
                            $.each(value.assets, function(i, assets) {

                                html += '<tr id="row'+ assets.id +'">';
                                html += '<td><input type="checkbox" name="checkbox" class="checkbox" id=""></td>';
                                html += '<td contenteditable="true" id="serial'+ assets.id +'">'+ assets.serial_no +'</td>';
                                html += '<td contenteditable="true" id="unit_name'+ assets.id +'">'+ assets.unit_name +'</td>';
                                html += '<td contenteditable="true" id="qty'+ assets.id +'">'+ assets.qty +'</td>';
                                html += '<td contenteditable="true" id="unit'+ assets.id +'">'+ assets.unit +'</td>';
                                html += '<td contenteditable="true" id="unit_type'+ assets.id +'">'+ assets.unit_type +'</td>';
                                html += '<td>';
                                html += '<button class="btn btn-warning btn-sm edit" id="'+ assets.id +'"><i class="fa fa-pencil"></i></button>';
                                html += '<button class="btn btn-danger btn-sm delete" id="'+ assets.id +'" style="margin-left: 5px;"><i class="fa fa-trash"></i></button>';
                                html += '</td>';
                                html += '</tr>';
                            });
                        });

                        $('#assets-lists').html(html);
                    }
                })
            }

            $(document).on('change', '#rooms', function(){

                var html = "";
                document.getElementById('footer').style.visibility  = 'hidden';
                document.getElementById('date_added').style.display = 'none';
                document.getElementById('action').style.display     = 'block';
                var room_val = $(this).val();

                $.ajax({
                    url : '<?= base_url(); ?>user/get_room_assets',
                    type: 'POST',
                    data: {
                        room_val : room_val
                    },
                    success:function(data){

                        var data_Object = JSON.parse(data);
                        console.log(data_Object);

                        $.each(data_Object, function(i, value){

                            $('#room_id').val(value.id);
                            $.each(value.assets, function(i, assets) {

                                html += '<tr id="row'+ assets.id +'">';
                                html += '<td><input type="checkbox" name="checkbox" class="checkbox" id=""></td>';
                                html += '<td contenteditable="true" id="serial'+ assets.id +'">'+ assets.serial_no +'</td>';
                                html += '<td contenteditable="true" id="unit_name'+ assets.id +'">'+ assets.unit_name +'</td>';
                                html += '<td contenteditable="true" id="qty'+ assets.id +'">'+ assets.qty +'</td>';
                                html += '<td contenteditable="true" id="unit'+ assets.id +'">'+ assets.unit +'</td>';
                                html += '<td contenteditable="true" id="unit_type'+ assets.id +'">'+ assets.unit_type +'</td>';
                                html += '<td>';
                                html += '<button class="btn btn-warning btn-sm edit" id="'+ assets.id +'"><i class="fa fa-pencil"></i></button>';
                                html += '<button class="btn btn-danger btn-sm delete" id="'+ assets.id +'" style="margin-left: 5px;"><i class="fa fa-trash"></i></button>';
                                html += '</td>';
                                html += '</tr>';
                            });
                        });

                        $('#assets-lists').html(html);
                    }
                })
            })

            $(document).on('click', '.edit', function(){

                var action    = 'update_assets';
                var id        = $(this).attr('id');
                var serial    = $('#serial' + id).text();
                var unit_name = $('#unit_name' + id).text();
                var qty       = $('#qty' + id).text();
                var unit      = $('#unit' + id).text();
                var unit_type = $('#unit_type' + id).text();

                $("tbody#assets-lists").find('input[name="checkbox"]').each(function(){

                    if($(this).is(":checked")){

                        $.ajax({
                            url: '<?= base_url(); ?>user/update_assets',
                            type: 'POST',
                            data: {
                                serial    : serial,
                                unit_name : unit_name,
                                qty       : qty,
                                unit      : unit,
                                unit_type : unit_type,
                                id        : id,
                                action    : action
                            },
                            success:function(data){

                                var data_Object = JSON.parse(data);
                                console.log(data_Object);
                                if(data_Object.update == true)
                                {
                                    $("#message").html('<div class="alert alert-success alert-dismissible fade show" role="alert">'
                                        + data_Object.message +
                                        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                                        '<span aria-hidden="true">&times;</span></button></div>'
                                    );
                                }
                                else {
                                    $("#message").html('<div class="alert alert-danger alert-dismissible fade show" role="alert">'
                                        + data_Object.message +
                                        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                                        '<span aria-hidden="true">&times;</span></button></div>'
                                    );
                                }
                            }
                        })
                    }
                });
            })

            $(document).on('click', '.delete', function(){
                var id = $(this).attr('id');
                $("tbody#assets-lists").find('input[name="checkbox"]').each(function(){
                    if($(this).is(":checked")){
                        if(confirm('Are you sure you want to delete?') == true)
                        {
                            $.ajax({
                                url: '<?= base_url(); ?>user/delete_assets',
                                type: 'POST',
                                data: {
                                    id : id
                                },
                                success:function(data){
                                    var data_Object = JSON.parse(data);
                                    console.log(data_Object);
                                    if(data_Object.delete == true)
                                    {
                                        $('#row' + id).remove();
                                        $("#message").html('<div class="alert alert-success alert-dismissible fade show" role="alert">'
                                            + data_Object.message +
                                            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                                            '<span aria-hidden="true">&times;</span></button></div>'
                                        );
                                    }
                                    else {
                                        $("#message").html('<div class="alert alert-danger alert-dismissible fade show" role="alert">'
                                            + data_Object.message +
                                            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                                            '<span aria-hidden="true">&times;</span></button></div>'
                                        );
                                    }
                                }
                            })
                        }
                    }
                })
            })

            $(document).on("click", "#add", function(){
                document.getElementById('footer').style.visibility  = 'visible';
                document.getElementById('date_added').style.display = 'block';
                document.getElementById('action').style.display     = 'none';
                $('#assets-lists').find('tr').remove();
            });

            var html_row = "", row_count = 1, save = false;
            $(document).on("click", ".btn_add_row", function(){
                save = true;
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
                $("tbody#assets-lists").append(html_row);
            });

            $(document).on("click", ".btn_del_row", function(e){
                $("tbody#assets-lists").find('input[name="checkbox"]').each(function(){
                    if($(this).is(":checked")){
                        $(this).parents("tr").remove();
                    }
                });
            });

            $(document).on('click', '.btn_hide', function(){
                room_asset();
                document.getElementById('footer').style.visibility  = 'hidden';
                document.getElementById('date_added').style.display = 'none';
                document.getElementById('action').style.display     = 'block';
                $('#assets-lists').find('tr').remove();
            })
            
            $(document).on("click", ".btn_save", function(){
                var error = '';
                var serial = [], asset_name = [], qty = [], unit = [], date = [], specific = [];
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
                
                var room_id = $('#room_id').val();
                if(save === true)
                {
                    if(error == ''){

                        $.ajax({

                            url: '<?= base_url(); ?>user/add_assets',
                            type: 'POST',
                            data: {
                                room_id    : room_id,
                                serial     : serial,
                                asset_name : asset_name,
                                unit       : unit,
                                date       : date,
                                specific   : specific,
                                qty        : qty
                            },
                            success:function(data){

                                var data_Object = JSON.parse(data);
                                console.log(data_Object);

                                if(data_Object.insert == true)
                                {
                                    $("#message").html('<div class="alert alert-success alert-dismissible fade show" role="alert">'
                                        + data_Object.message +
                                        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                                        '<span aria-hidden="true">&times;</span></button></div>');
                                    $('#assets-lists').find('tr').remove();
                                    save = false;
                                }
                                else
                                {
                                    $("#message").html('<div class="alert alert-danger alert-dismissible fade show" role="alert">'
                                        + data_Object.message +
                                        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                                        '<span aria-hidden="true">&times;</span></button></div>');
                                }
                            }
                        });
                    }
                    else
                    {
                        $("#message").html('<div class="alert alert-danger alert-dismissible fade show" role="alert">'
                            + error +
                            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                            '<span aria-hidden="true">&times;</span></button></div>');
                    }
                }
                else
                {
                    $("#message").html('<div class="alert alert-danger alert-dismissible fade show" role="alert">'
                    + 'You are not allowed to save or transfer asset in this mode. Click + button to add row for assets.' +
                    '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                    '<span aria-hidden="true">&times;</span></button></div>');
                }
            });

        });
    </script>