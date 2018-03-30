//Requete recuperation information image a generer
$query= "select numdon,numimage,nopage,numenreg,taille,type,val5 from STOCKDOC where val1 ='".$_POST['list'][$i]."' and val1 is not null and taille>='232'";
		$resultat=mysql_query($query);
	$plo=0;

            //$texte=$texte."EXECUTION REQUETE".date('ymdmis')." <br>";
		while($row=mysql_fetch_array($resultat)){

              CHAMPS UTILE POUR LA GENEARTION DE L'IMAGE
                $numdon[$j]=$row['numdon'];
                $numimage[$j]=$row['numimage'];
              $numenreg[$j]=$row['numenreg'];
               $taille[$j]=$row["taille"];
                $type[$j]=$row['type'];
                $jobid[$j]=date("ymdhms").$row['numenreg'].$plo;
                $nopage[$j]=$row['nopage'];
				$val5[$j]=$row['val5'];

                //echo $j;
       //nom de l'image
  $jobid[$j]=$nomchamps.date('dmmis').$j;
         $j++;
         //echo $jobid;
         //echo "teste";
		 $plo++;

       		}
           $i++;


            $texte=$texte.date('ymdmis')." <br>";
}
Creation des images
    $insert=geneartionimageancienGED($jobid,$numdon,$numimage,$nopage,$numenreg,$taille,$type,$val5,$j);

       //FONCTION FIN DE TRAITEMENT

function endjob($jobid,$connect)	{

		$query="select jobstate,jobid,b.numenreg as numrecc from d_jobs a , temp_job b where a.jobid=b.job_ib and  a.jobid like '".$_SESSION['user_connect']."%' order by date_creat desc";

		                echo $query;
		$stmt = ociparse($connect,$query);
		//echo $query;
	ociexecute($stmt,OCI_DEFAULT);
	$notok='END';
	$ok[0]=0;
	$ok[1]=0;
	echo "<tr><th>NUM RECEP</th><th>ETAT</th></tr>";
			while(ocifetch($stmt)){
				$pass='1';
				$ok[1]=1;
				if(($notok<>ociresult($stmt,'JOBSTATE'))&&($ok[0]==0)){
					$ok[0]=1;
					$notok=ociresult($stmt,'JOBSTATE');
				}
				$image='';
				if(ociresult($stmt,'JOBSTATE')<>'END'){
					$image="<img src='./images/barre.gif'><img src='./images/orange.png' height='19px'>";
				}else{

					$image="<img src='./images/okbarre.gif'><img src='./images/vert.png' height='19px'>";
				}
				echo "<tr><td>".ociresult($stmt,'NUMRECC')."</td><td>$image</td></tr>";
			}

		return ($ok);

	}


//INSERTION POUR GENERATION IMAGE

 function geneartionimageancienGED($jobid,$numdon,$numimage,$nopage,$numenreg,$taille,$type,$societe,$j)	{

 $insert_D_JOBS2="insert into D_JOBSPARAM values" ;
 $insert_D_JOBS="insert into D_JOBS (jobid,jobtyp,jobpriority,plgid,jobcreator,jobstate,jobdateask,jobtimeask)values";
$req="insert into temp_job values ";

          $i=0;
     while ($i<$j)
     {
     echo $type[$i];
     switch ($type[$i])
			{
		//	case '4': $format="'".type_image($societe[$i])."'";
		//	case '4': $format="'".type_image($societe[$i])."'";

			case '4': $format="'1'";
			break;
			//case '8': $format="'65535'";

		case '8': $format="'65535'";
		//	case '8': $format="'".type_image($societe)."'";

			break;
			}
		$format="'65535'";
		//$format="'6'";
 $insert_D_JOBS=$insert_D_JOBS."('".$jobid[$i]."'		,'O','1','GetPage','DEALTIS JOB','IDL','".date('Ymd')."','".date('Hms')."'),";
 //echo $insert_D_JOBS;
 if($type[$i]=='8'){
  $insert_D_JOBS2=$insert_D_JOBS2."('".$jobid[$i]."','Iitem','0','MANAGER;MGR;TOTO;STOCKDOC;".$type[$i].";".$numdon[$i].";".$numimage[$i].";".$numenreg[$i].";".$taille[$i].";".$nopage[$i].";' ),('".$jobid[$i]."','Oitem','0','u:\\\\'),( '".$jobid[$i]."','JobUnit','0',''),( '$jobid[$i]','Format','0',$format),( '".$jobid[$i]."','Zoom','0','100'),( '".$jobid[$i]."','Epa','0',''),( '".$jobid[$i]."','Rotation','0','0'),('".$jobid[$i]."','Wpa','0',''),( '".$jobid[$i]."','Spa','0','') ,";

 }else{
 $insert_D_JOBS2=$insert_D_JOBS2."('".$jobid[$i]."','Iitem','0','MANAGER;MGR;TOTO;STOCKDOC;".$type[$i].";".$numdon[$i].";".$numimage[$i].";".$numenreg[$i].";".$taille[$i].";".$nopage[$i].";' ),('".$jobid[$i]."','Oitem','0','\\\\\\\\127.0.0.1\\\\recepcreation\\\\'),( '".$jobid[$i]."','JobUnit','0',''),( '$jobid[$i]','Format','0',$format),( '".$jobid[$i]."','Zoom','0','100'),( '".$jobid[$i]."','Epa','0',''),( '".$jobid[$i]."','Rotation','0','0'),('".$jobid[$i]."','Wpa','0',''),( '".$jobid[$i]."','Spa','0','') ,";
   }
   $req=$req."('".$jobid[$i]."','".date('Ymd')."','".chop($numenreg[$i])."'),";
       // $this->laDbExternal[BASEWEB]->query($insert_D_JOBS);
   // echo $insert_D_JOBS;
         $i++;
	}


  $req=substr($req,0,-1);

  //echo $req;
  mysql_query($req);
	   mysql_query(substr($insert_D_JOBS,0,-1));
     mysql_query(substr($insert_D_JOBS2,0,-1));

   }
